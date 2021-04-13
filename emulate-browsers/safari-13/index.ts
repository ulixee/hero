import { URL } from 'url';
import INetworkInterceptorDelegate from '@secret-agent/core-interfaces/INetworkInterceptorDelegate';
import {
  BrowserEmulatorClassDecorator,
  DataLoader,
  DomOverridesBuilder,
  getEngine,
  getTcpSettingsForOs,
  modifyHeaders,
  parseNavigatorPlugins,
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
import IHttpResourceLoadDetails from '@secret-agent/core-interfaces/IHttpResourceLoadDetails';
import IResolvablePromise from '@secret-agent/core-interfaces/IResolvablePromise';
import { createPromise, pickRandom } from '@secret-agent/commons/utils';
import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';
import IWindowFraming from '@secret-agent/core-interfaces/IWindowFraming';
import Log from '@secret-agent/commons/Logger';
import IUserAgentMatchMeta from '@secret-agent/core-interfaces/IUserAgentMatchMeta';
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

@BrowserEmulatorClassDecorator
export default class Safari13 {
  public static id = pkg.name;
  public static roundRobinPercent: number = (config as any).marketshare;

  public static engine = getEngine(engineObj, config.browserEngine.executablePathEnvVar);

  public readonly networkInterceptorDelegate: INetworkInterceptorDelegate;

  public canPolyfill = false;

  public sessionId: string;

  public set locale(value: string) {
    this._locale = value;
    this.hasCustomLocale = true;
  }

  public get locale() {
    return this._locale;
  }

  public readonly userAgentString: string;
  public readonly osPlatform: string;

  public cookieJar = new CookieJar(null, { rejectPublicSuffixes: false });
  // track sites per safari ITP that are considered to have "first party user interaction"
  public sitesWithUserInteraction: string[] = [];
  // This Flag Should be enabled once double agent deciphers patch level changes
  public enableNov2019ITPSupport = false;

  public enableFeb2020ITPSupport = false;

  public cookiesPendingSiteInteraction: {
    [site: string]: { cookie: Cookie; sourceUrl: string; sameSiteContext: SameSiteContext }[];
  } = {};

  public get userProfile(): IUserProfile {
    return this._userProfile;
  }

  public set userProfile(userProfile: IUserProfile) {
    this._userProfile = userProfile;
    if (userProfile.cookies) {
      this.loadProfileCookies();
    }
  }

  public windowFramingBase: IWindowFraming = windowFramingBase;
  public windowFraming: IWindowFraming;

  protected domOverrides = new DomOverridesBuilder();
  private _userProfile: IUserProfile;

  private _locale = 'en-US';
  private hasCustomLocale = false;

  private userAgentVersion: { major: string; minor: string; patch?: string };

  private readonly userInteractionTrigger: {
    [site: string]: IResolvablePromise;
  } = {};

  constructor(matchMeta?: IUserAgentMatchMeta) {
    const userAgentOption = selectUserAgentOption(matchMeta);
    const windowNavigator = windowNavigatorData.get(userAgentOption.operatingSystemId);
    this.osPlatform = windowNavigator.navigator.platform._$value;
    this.userAgentString = userAgentOption.string;
    this.userAgentVersion = userAgentOption.version;
    this.windowFraming = windowFramingData.get(userAgentOption.operatingSystemId);

    this.networkInterceptorDelegate = {
      tcp: getTcpSettingsForOs(userAgentOption.operatingSystemId),
      tls: {
        emulatorProfileId: 'Safari13',
      },
      http: {
        requestHeaders: modifyHeaders.bind(
          this,
          userAgentOption.string,
          headerProfiles,
          this.hasCustomLocale,
        ),
        cookieHeader: this.getCookieHeader.bind(this),
        onSetCookie: this.setCookie.bind(this),
        onOriginHasFirstPartyInteraction: this.documentHasUserActivity.bind(this),
      },
    };
    this.loadDomOverrides(userAgentOption.operatingSystemId);
  }

  public async newDocumentInjectedScripts() {
    const result = this.domOverrides.build();
    Object.assign(result[0], {
      callback: ({ cookie, origin }) => {
        try {
          this.cookieJar.setCookie(cookie, origin);
        } catch (error) {
          log.warn('Error setting cookie from page', {
            error,
            sessionId: this.sessionId,
          });
        }
      },
      callbackWindowName: cookieCallbackName,
    });
    return result;
  }

  public async newWorkerInjectedScripts() {
    const result = this.domOverrides.build([
      'Error.captureStackTrace',
      'Error.constructor',
      'navigator.deviceMemory',
      'navigator',
      'WebGLRenderingContext.prototype.getParameter',
    ]);
    return result;
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

  private loadProfileCookies() {
    const originUrls = (Object.keys(this.userProfile.storage ?? {}) ?? []).map(x => new URL(x));
    const cookies = this.userProfile.cookies;
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

  public static isMatch(meta: IUserAgentMatchMeta) {
    if (!config.browserMatcher) return false;
    const matchName = (config.browserMatcher.name || '').toLowerCase();
    const matchVersionRange = config.browserMatcher.versionRange || [];
    const betaBrowser = meta.browser;
    if (betaBrowser.name !== matchName) return false;

    const minMajorVersion = Math.min(...matchVersionRange);
    const maxMajorVersion = Math.max(...matchVersionRange);

    return betaBrowser.version.major >= minMajorVersion && betaBrowser.version.major <= maxMajorVersion;
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
