import { URL } from 'url';
import {
  BrowserEmulatorClassDecorator,
  DataLoader,
  DomOverridesBuilder,
  getEngine,
  getTcpSettingsForOs,
  IBrowserEmulator,
  modifyHeaders,
  parseNavigatorPlugins,
  Viewports,
} from '@secret-agent/emulate-browsers-base';
import {
  canonicalDomain,
  Cookie,
  CookieJar,
  domainMatch,
  getPublicSuffix,
  permuteDomain,
} from 'tough-cookie';
import { randomBytes } from 'crypto';
import SameSiteContext from '@secret-agent/commons/interfaces/SameSiteContext';
import IHttpResourceLoadDetails from '@secret-agent/interfaces/IHttpResourceLoadDetails';
import IResolvablePromise from '@secret-agent/interfaces/IResolvablePromise';
import { createPromise, pickRandom } from '@secret-agent/commons/utils';
import IWindowFraming from '@secret-agent/interfaces/IWindowFraming';
import Log from '@secret-agent/commons/Logger';
import IUserAgentMatchMeta from '@secret-agent/interfaces/IUserAgentMatchMeta';
import INetworkEmulation from '@secret-agent/interfaces/INetworkEmulation';
import IBrowserEmulatorConfiguration from '@secret-agent/interfaces/IBrowserEmulatorConfiguration';
import { IPuppetPage } from '@secret-agent/interfaces/IPuppetPage';
import { IPuppetWorker } from '@secret-agent/interfaces/IPuppetWorker';
import IDevtoolsSession from '@secret-agent/interfaces/IDevtoolsSession';
import * as Path from 'path';
import * as os from 'os';
import * as pkg from './package.json';
import * as headerProfiles from './data/headers.json';
import * as userAgentOptions from './data/user-agent-options.json';
import * as config from './config.json';
import * as windowFramingBase from './data/window-framing.json';

const windowFramingData = new DataLoader(`${__dirname}/data`, 'window-framing');
const windowNavigatorData = new DataLoader(`${__dirname}/data`, 'window-navigator');
const codecsData = new DataLoader(`${__dirname}/data`, 'codecs');

const cookieCallbackName = 'SecretAgentSetCookie';
const { log } = Log(module);

const engineObj = {
  name: config.browserEngine.name,
  fullVersion: config.browserEngine.fullVersion,
};
let sessionDirCounter = 0;

@BrowserEmulatorClassDecorator
export default class Safari13 implements IBrowserEmulator {
  public static id = pkg.name;
  public static roundRobinPercent: number = (config as any).marketshare;

  public static engine = getEngine(
    engineObj,
    config.browserEngine.executablePathEnvVar,
    Safari13.getLaunchArguments,
  );

  public canPolyfill = false;

  public sessionId: string;

  public readonly userAgentString: string;
  public readonly osPlatform: string;
  public configuration: IBrowserEmulatorConfiguration;

  public cookieJar = new CookieJar(null, { rejectPublicSuffixes: false });
  // track sites per safari ITP that are considered to have "first party user interaction"
  public sitesWithUserInteraction: string[] = [];
  // This Flag Should be enabled once double agent deciphers patch level changes
  public enableNov2019ITPSupport = false;

  public enableFeb2020ITPSupport = false;

  public cookiesPendingSiteInteraction: {
    [site: string]: { cookie: Cookie; sourceUrl: string; sameSiteContext: SameSiteContext }[];
  } = {};

  public windowFramingBase: IWindowFraming = windowFramingBase;
  public windowFraming: IWindowFraming;

  public socketSettings: INetworkEmulation['socketSettings'] = {
    tlsClientHelloId: 'Safari13',
  };

  protected domOverrides = new DomOverridesBuilder();
  private hasCustomLocale = false;

  private userAgentVersion: { major: string; minor: string; patch?: string };

  private readonly userInteractionTrigger: {
    [site: string]: IResolvablePromise;
  } = {};

  constructor(configuration: IBrowserEmulatorConfiguration, matchMeta?: IUserAgentMatchMeta) {
    const userAgentOption = selectUserAgentOption(matchMeta);
    const windowNavigator = windowNavigatorData.get(userAgentOption.operatingSystemId);
    this.osPlatform = windowNavigator.navigator.platform._$value;
    this.userAgentString = userAgentOption.string;
    this.userAgentVersion = userAgentOption.version;
    this.windowFraming = windowFramingData.get(userAgentOption.operatingSystemId);

    const tcpSettings = getTcpSettingsForOs(userAgentOption.operatingSystemId);
    if (tcpSettings) {
      this.socketSettings.tcpTtl = tcpSettings.ttl;
      this.socketSettings.tcpWindowSize = tcpSettings.windowSize;
    }

    this.configuration = configuration ?? {};
    this.configuration.locale ??= 'en-US,en';
    if (configuration.locale !== 'en-US,en') {
      this.hasCustomLocale = true;
    }
    this.configuration.timezoneId ??= Intl.DateTimeFormat().resolvedOptions().timeZone;
    this.configuration.viewport ??= Viewports.getDefault(
      this.windowFraming,
      this.windowFramingBase,
    );
    if (this.configuration.userProfile?.cookies) {
      this.loadProfileCookies();
    }
    this.loadDomOverrides(userAgentOption.operatingSystemId);
  }

  public async beforeHttpRequest(request: IHttpResourceLoadDetails): Promise<any> {
    // never send cookies to preflight requests
    if (request.method !== 'OPTIONS') {
      const cookieHeader = await this.getCookieHeader(request);
      const existingCookies = Object.entries(request.requestHeaders).find(([key]) =>
        key.match(/^cookie/i),
      );
      const existingCookie = existingCookies ? existingCookies[1] : null;
      if (existingCookie !== cookieHeader) {
        const headerKey = existingCookies ? existingCookies[0] : 'Cookie';
        if (cookieHeader) {
          request[headerKey] = cookieHeader;
        } else {
          delete request.requestHeaders[headerKey];
        }
      }
    }

    const modifiedHeaders = modifyHeaders(
      this.userAgentString,
      headerProfiles,
      this.hasCustomLocale,
      request,
      this.sessionId,
    );
    if (modifiedHeaders) request.requestHeaders = modifiedHeaders;
  }

  public async beforeHttpResponse(resource: IHttpResourceLoadDetails): Promise<any> {
    let cookies =
      resource.responseHeaders['set-cookie'] ?? resource.responseHeaders['Set-Cookie'] ?? [];
    if (!Array.isArray(cookies)) cookies = [cookies];

    for (const setCookie of cookies) {
      try {
        await this.setCookie(setCookie, resource);
      } catch (error) {
        log.warn('Could not set cookie', { sessionId: this.sessionId, error });
      }
    }
  }

  public websiteHasFirstPartyInteraction(url: URL) {
    this.documentHasUserActivity(url);
  }

  public async configure(options: IBrowserEmulatorConfiguration): Promise<void> {
    if (options.userProfile) {
      this.configuration.userProfile = options.userProfile;
      this.loadProfileCookies();
    }
  }

  public onNewPuppetPage(page: IPuppetPage): Promise<any> {
    // Don't await here! we want to queue all these up to run before the debugger resumes
    const devtools = page.devtoolsSession;
    const promises = [
      this.setUserAgent(devtools),
      this.setTimezone(devtools),
      this.setLocale(devtools),
      this.setScreensize(devtools),
      devtools.send('Emulation.setFocusEmulationEnabled', { enabled: true }).catch(err => err),
    ];
    const scripts = this.domOverrides.build();

    scripts[0].callback = async ({ cookie, origin }) => {
      try {
        await this.cookieJar.setCookie(cookie, origin);
      } catch (error) {
        log.warn('Error setting cookie from page', {
          error,
          sessionId: this.sessionId,
        });
      }
    };
    scripts[0].callbackWindowName = cookieCallbackName;

    for (const script of scripts) {
      if (script.callbackWindowName) {
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        promises.push(
          page.addPageCallback(script.callbackWindowName, payload => {
            script.callback(JSON.parse(payload));
          }),
        );
      }
      // overrides happen in main frame
      promises.push(page.addNewDocumentScript(script.script, false));
    }
    return Promise.all(promises);
  }

  public onNewPuppetWorker(worker: IPuppetWorker): Promise<any> {
    const scripts = this.domOverrides.build([
      'Error.captureStackTrace',
      'Error.constructor',
      'navigator.deviceMemory',
      'navigator',
      'WebGLRenderingContext.prototype.getParameter',
    ]);
    return Promise.all([
      this.setUserAgent(worker.devtoolsSession),
      ...scripts.map(x => worker.evaluate(x.script, true)),
    ]);
  }

  protected loadDomOverrides(operatingSystemId: string) {
    const domOverrides = this.domOverrides;
    domOverrides.add('Error.captureStackTrace');
    domOverrides.add('Error.constructor');

    const deviceMemory = Math.ceil(Math.random() * 4) * 2;
    domOverrides.add('navigator.deviceMemory', { memory: deviceMemory });
    domOverrides.add('navigator', {
      userAgentString: this.userAgentString,
      platform: this.osPlatform,
      headless: Safari13.engine.isHeaded !== true,
    });

    domOverrides.add('MediaDevices.prototype.enumerateDevices', {
      videoDevice: {
        deviceId: randomBytes(32).toString('hex'),
        groupId: randomBytes(32).toString('hex'),
      },
    });

    domOverrides.add('Notification.permission');
    domOverrides.add('Permission.prototype.query');

    const windowNavigator = windowNavigatorData.get(operatingSystemId);
    domOverrides.add('navigator.plugins', parseNavigatorPlugins(windowNavigator.navigator));
    domOverrides.add('WebGLRenderingContext.prototype.getParameter', {
      // UNMASKED_VENDOR_WEBGL
      37445: 'Intel Inc.',
      // UNMASKED_RENDERER_WEBGL
      37446: 'Intel Iris OpenGL Engine',
    });
    domOverrides.add('console.debug');

    domOverrides.add('Element.prototype.attachShadow');

    domOverrides.add('window.outerWidth', {
      frameBorderWidth: this.windowFraming.frameBorderWidth,
    });
    domOverrides.add('window.outerHeight', {
      frameBorderHeight: this.windowFraming.frameBorderHeight,
    });

    const agentCodecs = codecsData.get(operatingSystemId);
    if (agentCodecs) {
      domOverrides.add('HTMLMediaElement.prototype.canPlayType', {
        audioCodecs: agentCodecs.audioSupport,
        videoCodecs: agentCodecs.videoSupport,
      });
      domOverrides.add('MediaRecorder.isTypeSupported', {
        supportedCodecs: agentCodecs.audioSupport.recordingFormats.concat(
          agentCodecs.videoSupport.recordingFormats,
        ),
      });
      domOverrides.add('RTCRtpSender.getCapabilities', {
        videoCodecs: agentCodecs.webRtcVideoCodecs,
        audioCodecs: agentCodecs.webRtcAudioCodecs,
      });
    }

    domOverrides.add('Document.prototype.cookie', {
      callbackName: cookieCallbackName,
    });
  }

  protected async setUserAgent(devtools: IDevtoolsSession) {
    return devtools.send('Network.setUserAgentOverride', {
      userAgent: this.userAgentString,
      acceptLanguage: this.configuration.locale,
      platform: this.osPlatform,
    });
  }

  protected async setScreensize(devtools: IDevtoolsSession): Promise<void> {
    const { viewport } = this.configuration;
    if (!viewport) return;
    await devtools.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: viewport.deviceScaleFactor ?? 1,
      positionX: viewport.positionX,
      positionY: viewport.positionY,
      screenWidth: viewport.screenWidth,
      screenHeight: viewport.screenHeight,
      mobile: false,
    });
  }

  protected async setTimezone(devtools: IDevtoolsSession): Promise<void> {
    const { timezoneId } = this.configuration;
    if (!timezoneId) return;
    try {
      await devtools.send('Emulation.setTimezoneOverride', { timezoneId });
    } catch (error) {
      if (error.message.includes('Timezone override is already in effect')) return;
      if (error.message.includes('Invalid timezone'))
        throw new Error(`Invalid timezone ID: ${timezoneId}`);
      throw error;
    }
  }

  protected async setLocale(devtools: IDevtoolsSession): Promise<void> {
    const { locale } = this.configuration;
    if (!locale) return;
    try {
      await devtools.send('Emulation.setLocaleOverride', { locale });
    } catch (error) {
      // not installed in Chrome 80
      if (error.message.includes("'Emulation.setLocaleOverride' wasn't found")) return;
      // All pages in the same renderer share locale. All such pages belong to the same
      // context and if locale is overridden for one of them its value is the same as
      // we are trying to set so it's not a problem.
      if (error.message.includes('Another locale override is already in effect')) return;
      throw error;
    }
  }

  private loadProfileCookies() {
    const userProfile = this.configuration.userProfile;
    const originUrls = (Object.keys(userProfile.storage ?? {}) ?? []).map(x => new URL(x));
    const cookies = userProfile.cookies;
    for (const cookie of cookies) {
      let url = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
      const match = originUrls.find(x => {
        return x.hostname.endsWith(cookie.domain);
      });
      if (match) url = match.href;
      const cookieProps = {
        ...cookie,
        key: cookie.name,
        expires: cookie.expires !== '-1' ? new Date(parseInt(cookie.expires, 10)) : undefined,
      };
      if (!cookieProps.expires) delete cookieProps.expires;
      this.cookieJar.setCookieSync(new Cookie(cookieProps), url, {
        ignoreError: true,
      });
    }
    for (const origin of originUrls) {
      this.documentHasUserActivity(origin);
    }
  }

  private documentHasUserActivity(url: URL) {
    const hostname = canonicalDomain(url.hostname);
    if (!this.sitesWithUserInteraction.includes(hostname)) {
      this.sitesWithUserInteraction.push(hostname);
      let documentLoaded = this.userInteractionTrigger[hostname];
      if (!documentLoaded) {
        documentLoaded = createPromise();
        this.userInteractionTrigger[hostname] = documentLoaded;
      }

      (async () => {
        for (const { cookie, sourceUrl, sameSiteContext } of this.cookiesPendingSiteInteraction[
          hostname
        ] ?? []) {
          await this.cookieJar.setCookie(cookie, sourceUrl, {
            sameSiteContext,
          } as any);
        }
        delete this.cookiesPendingSiteInteraction[hostname];
      })()
        .then(documentLoaded.resolve)
        .catch(documentLoaded.reject);
    }
  }

  private async setCookie(cookiestring: string, resource: IHttpResourceLoadDetails) {
    const { url } = resource;
    const hostname = canonicalDomain(url.hostname);
    const cookie = Cookie.parse(cookiestring);
    const sameSiteContext = getSameSiteContext(resource);

    if (resource.hasUserGesture) {
      this.documentHasUserActivity(url);
    }
    if (!this.sitesWithUserInteraction.includes(hostname)) {
      if (!this.cookiesPendingSiteInteraction[hostname]) {
        this.cookiesPendingSiteInteraction[hostname] = [];
      }

      if (this.enableNov2019ITPSupport) {
        this.cookiesPendingSiteInteraction[hostname].push({
          sourceUrl: url.href,
          cookie,
          sameSiteContext,
        });
        return;
      }
    }
    await this.cookieJar.setCookie(cookie, url.href, {
      sameSiteContext,
    } as any);
  }

  private async getCookieHeader(resource: IHttpResourceLoadDetails) {
    const { url, documentUrl } = resource;

    let sourceDocumentUrl = documentUrl;
    if (!sourceDocumentUrl && resource.isUserNavigation) sourceDocumentUrl = url.href;

    let sameSiteContext = getSameSiteContext(resource);
    if (resource.isFromRedirect) {
      const currentUrl = resource.url;
      const previousDomain = new URL(resource.firstRedirectingUrl);

      if (getPublicSuffix(previousDomain.hostname) === getPublicSuffix(currentUrl.hostname)) {
        sameSiteContext = 'strict';
      }
    }
    await this.waitForDocumentCookiesLoaded(sourceDocumentUrl);
    let cookies = await this.cookieJar.getCookies(url.href, {
      sameSiteContext,
    } as any);

    if (sameSiteContext === 'none') {
      cookies = cookies.filter(x => this.hasFirstPartyInteractionForDomain(x.domain));
    }

    cookies = this.handleNov2019ITPUpdates(sourceDocumentUrl, sameSiteContext, cookies);

    /** *
     * TBD:
     * >> Safari 13.1
     * (https://webkit.org/blog/9661/preventing-tracking-prevention-tracking/)
     * Cookies for cross-site resources are now blocked by default across the board. This is a
     * significant improvement for privacy since it removes any sense of exceptions or “a little bit
     * of cross-site tracking is allowed.”
     */
    if (this.enableFeb2020ITPSupport && this.isMinimumVersion(1) && sameSiteContext === 'none') {
      cookies = [];
    }

    return cookies.map(x => x.cookieString()).join('; ');
  }

  private async waitForDocumentCookiesLoaded(url: string) {
    const interactUrl = new URL(url);
    const hostname = canonicalDomain(interactUrl.hostname);
    if (!this.userInteractionTrigger[hostname]) {
      return;
    }
    await this.userInteractionTrigger[hostname];
  }

  private hasFirstPartyInteractionForDomain(domain: string) {
    for (const site of this.sitesWithUserInteraction) {
      const permutations = permuteDomain(site) ?? [site.split('.').slice(-2).join('.'), site];
      for (const perm of permutations) {
        if (domainMatch(perm, domain)) return true;
      }
    }
    return false;
  }

  private handleNov2019ITPUpdates(
    sourceDocumentUrl: string,
    sameSiteContext: SameSiteContext,
    cookies: Cookie[],
  ) {
    if (!this.enableNov2019ITPSupport) {
      return cookies;
    }
    /**
     * https://webkit.org/blog/9521/intelligent-tracking-prevention-2-3/
     *
     * >> Safari 13.0.4 on macOS Catalina, Mojave, and High Sierra.
     * (https://webkit.org/blog/9661/preventing-tracking-prevention-tracking/)
     * ITP will now block all third-party requests from seeing their cookies, regardless of the
     * classification status of the third-party domain, unless the first-party website has already
     * received user interaction.
     *
     * Safari’s default cookie policy requires a third-party to have “seeded” its cookie jar as first-party
     * before it can use cookies as third-party. This means the absence of cookies in a third-party request
     * can be due to ITP blocking existing cookies or the default cookie policy blocking cookies because the
     * user never visited the website, the website’s cookies have expired, or because the user or
     * ITP has explicitly deleted the website’s cookies.
     */
    if (this.isMinimumVersion(0, 4) && sameSiteContext !== 'strict') {
      const domain = canonicalDomain(sourceDocumentUrl);
      if (!this.sitesWithUserInteraction.some(y => domainMatch(y, domain))) {
        return [];
      }
    }
    return cookies;
  }

  private isMinimumVersion(minor: number, patch = 0) {
    return (
      Number(this.userAgentVersion.minor) >= minor && Number(this.userAgentVersion.patch) >= patch
    );
  }

  public static getLaunchArguments(
    options: {
      showBrowser?: boolean;
      disableGpu?: boolean;
      disableDevtools?: boolean;
    },
    defaultArguments: string[],
  ): string[] {
    const chromeArguments = [
      ...defaultArguments,
      '--disable-background-networking', // Disable various background network services, including extension updating,safe browsing service, upgrade detector, translate, UMA
      '--enable-features=NetworkService,NetworkServiceInProcess',
      '--disable-background-timer-throttling', // Disable timers being throttled in background pages/tabs
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad', // Disable crashdump collection (reporting is already disabled in Chromium)
      '--disable-client-side-phishing-detection', //  Disables client-side phishing detection.
      '--disable-domain-reliability', // Disables Domain Reliability Monitoring, which tracks whether the browser has difficulty contacting Google-owned sites and uploads reports to Google.
      '--disable-default-apps', // Disable installation of default apps on first run
      '--disable-dev-shm-usage', // https://github.com/GoogleChrome/puppeteer/issues/1834
      '--disable-extensions', // Disable all chrome extensions.
      '--disable-features=PaintHolding,TranslateUI,site-per-process,OutOfBlinkCors', // site-per-process = Disables OOPIF, OutOfBlinkCors = Disables feature in chrome80/81 for out of process cors
      '--disable-blink-features=AutomationControlled',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection', // Some javascript functions can be used to flood the browser process with IPC. By default, protection is on to limit the number of IPC sent to 10 per second per frame.
      '--disable-prompt-on-repost', // Reloading a page that came from a POST normally prompts the user.
      '--disable-renderer-backgrounding', // This disables non-foreground tabs from getting a lower process priority This doesn't (on its own) affect timers or painting behavior. karma-chrome-launcher#123
      '--disable-sync', // Disable syncing to a Google account

      '--force-color-profile=srgb', // Force all monitors to be treated as though they have the specified color profile.
      '--use-gl=any', // Select which implementation of GL the GPU process should use. Options are: desktop: whatever desktop OpenGL the user has installed (Linux and Mac default). egl: whatever EGL / GLES2 the user has installed (Windows default - actually ANGLE). swiftshader: The SwiftShader software renderer.
      '--disable-partial-raster', // https://crbug.com/919955
      '--disable-skia-runtime-opts', // Do not use runtime-detected high-end CPU optimizations in Skia.

      '--incognito',

      '--use-fake-device-for-media-stream',

      '--no-default-browser-check', //  Disable the default browser check, do not prompt to set it as such
      '--metrics-recording-only', // Disable reporting to UMA, but allows for collection
      '--no-first-run', // Skip first run wizards

      // '--enable-automation', BAB - disable because adds infobar, stops auto-reload on network errors (using other flags)
      '--enable-auto-reload', // Enable auto-reload of error pages.

      '--password-store=basic', // Avoid potential instability of using Gnome Keyring or KDE wallet.
      '--use-mock-keychain', // Use mock keychain on Mac to prevent blocking permissions dialogs
      '--allow-running-insecure-content',

      // don't leak private ip
      '--force-webrtc-ip-handling-policy=default_public_interface_only',
      '--no-startup-window',
    ];

    if (options.showBrowser) {
      chromeArguments.push(
        `--user-data-dir=${Path.join(
          os.tmpdir(),
          this.engine.fullVersion.replace('.', '-'),
          '-data',
          String((sessionDirCounter += 1)),
        )}`,
      ); // required to allow multiple browsers to be headed

      if (!options.disableDevtools) chromeArguments.push('--auto-open-devtools-for-tabs');
    } else {
      chromeArguments.push(
        '--hide-scrollbars',
        '--mute-audio',
        '--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4', // adds cursor to headless linux
      );
    }

    if (options.disableGpu === true) {
      chromeArguments.push('--disable-gpu', '--disable-software-rasterizer');
      const idx = chromeArguments.indexOf('--use-gl=any');
      if (idx >= 0) chromeArguments.splice(idx, 1);
    }
    return chromeArguments;
  }

  public static isMatch(meta: IUserAgentMatchMeta) {
    if (!config.browserMatcher) return false;
    const matchName = (config.browserMatcher.name || '').toLowerCase();
    const matchVersionRange = config.browserMatcher.versionRange || [];
    const betaBrowser = meta.browser;
    if (betaBrowser.name !== matchName) return false;

    const minMajorVersion = Math.min(...matchVersionRange);
    const maxMajorVersion = Math.max(...matchVersionRange);

    return (
      betaBrowser.version.major >= minMajorVersion && betaBrowser.version.major <= maxMajorVersion
    );
  }
}

function getSameSiteContext(resource: IHttpResourceLoadDetails): SameSiteContext {
  const { hasUserGesture, originType } = resource;
  if (originType === 'same-site' || originType === 'same-origin' || originType === 'none') {
    return 'strict';
  }
  if (hasUserGesture) {
    return 'lax';
  }
  return 'none';
}

function selectUserAgentOption(meta: IUserAgentMatchMeta) {
  if (!meta) return pickRandom(userAgentOptions as any[]);
  const filteredOptions = userAgentOptions.filter(userAgentOption => {
    if (userAgentOption.browserId !== meta.browser.id) return false;
    if (userAgentOption.operatingSystemId !== meta.operatingSystem.id) return false;
    return true;
  });
  return pickRandom(filteredOptions);
}
