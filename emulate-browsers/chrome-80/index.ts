import {
  BrowserEmulatorClassDecorator,
  DataLoader,
  DnsOverTlsProviders,
  DomOverridesBuilder,
  DomPolyfillLoader,
  getEngine,
  getTcpSettingsForOs,
  IBrowserEmulator,
  modifyHeaders,
  parseNavigatorPlugins,
  Viewports,
} from '@secret-agent/emulate-browsers-base';
import IUserAgentMatchMeta from '@secret-agent/core-interfaces/IUserAgentMatchMeta';
import { randomBytes } from 'crypto';
import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';
import { pickRandom } from '@secret-agent/commons/utils';
import IWindowFraming from '@secret-agent/core-interfaces/IWindowFraming';
import IHttpResourceLoadDetails from '@secret-agent/core-interfaces/IHttpResourceLoadDetails';
import INetworkEmulation from '@secret-agent/core-interfaces/INetworkEmulation';
import IBrowserEmulatorConfiguration from '@secret-agent/core-interfaces/IBrowserEmulatorConfiguration';
import { IPuppetPage } from '@secret-agent/core-interfaces/IPuppetPage';
import { IPuppetWorker } from '@secret-agent/core-interfaces/IPuppetWorker';
import IDevtoolsSession from '@secret-agent/core-interfaces/IDevtoolsSession';
import * as pkg from './package.json';

const config = require('./config.json');
const headerProfiles = require('./data/headers.json');
const userAgentOptions = require('./data/user-agent-options.json');
const windowFramingBase = require('./data/window-framing.json');

const windowFramingData = new DataLoader(`${__dirname}/data`, 'window-framing');
const windowChromeData = new DataLoader(`${__dirname}/data`, 'window-chrome');
const windowNavigatorData = new DataLoader(`${__dirname}/data`, 'window-navigator');
const codecsData = new DataLoader(`${__dirname}/data`, 'codecs');
const domPolyfillData = new DomPolyfillLoader(`${__dirname}/data`);

const engineObj = {
  name: config.browserEngine.name,
  fullVersion: config.browserEngine.fullVersion,
};

@BrowserEmulatorClassDecorator
export default class Chrome80 implements IBrowserEmulator {
  public static id = pkg.name;
  public static roundRobinPercent: number = config.marketshare;

  public static engine = getEngine(engineObj, config.browserEngine.executablePathEnvVar);

  public static dnsOverTlsConnectOptions = DnsOverTlsProviders.Cloudflare;

  public canPolyfill: boolean;

  public sessionId: string;
  public readonly userAgentString: string;
  public readonly osPlatform: string;
  public configuration: IBrowserEmulatorConfiguration;

  public readonly socketSettings: INetworkEmulation['socketSettings'] = {
    tlsClientHelloId: 'Chrome80',
  };

  public readonly dns = {
    dnsOverTlsConnection: Chrome80.dnsOverTlsConnectOptions,
  };

  public userProfile: IUserProfile;

  public windowFramingBase: IWindowFraming = windowFramingBase;
  public windowFraming: IWindowFraming;

  protected domOverrides = new DomOverridesBuilder();

  private get hasCustomLocale(): boolean {
    return this.configuration.locale !== 'en-US,en';
  }

  constructor(configuration: IBrowserEmulatorConfiguration, matchMeta?: IUserAgentMatchMeta) {
    const userAgentOption = selectUserAgentOption(matchMeta);
    const windowNavigator = windowNavigatorData.get(userAgentOption.operatingSystemId);
    this.osPlatform = windowNavigator.navigator.platform._$value;
    this.userAgentString = userAgentOption.string;
    this.canPolyfill = !!domPolyfillData.get(userAgentOption.operatingSystemId);
    this.windowFraming = windowFramingData.get(userAgentOption.operatingSystemId);

    const tcpSettings = getTcpSettingsForOs(userAgentOption.operatingSystemId);
    if (tcpSettings) {
      this.socketSettings.tcpTtl = tcpSettings.ttl;
      this.socketSettings.tcpWindowSize = tcpSettings.windowSize;
    }

    this.configuration = configuration ?? {};
    this.configuration.locale ??= 'en-US,en';
    this.configuration.timezoneId ??= Intl.DateTimeFormat().resolvedOptions().timeZone;
    this.configuration.viewport ??= Viewports.getDefault(
      this.windowFraming,
      this.windowFramingBase,
    );

    this.loadDomOverrides(userAgentOption.operatingSystemId);
  }

  async configure(configuration: IBrowserEmulatorConfiguration) {
    if (!configuration) return;
    const { locale, userProfile, viewport, timezoneId } = configuration;

    if (locale) this.configuration.locale = locale;
    if (viewport) this.configuration.viewport = viewport;
    if (userProfile) this.configuration.userProfile = userProfile;
    if (timezoneId) this.configuration.timezoneId = timezoneId;
  }

  public async beforeHttpRequest(request: IHttpResourceLoadDetails): Promise<any> {
    const modifiedHeaders = modifyHeaders(
      this.userAgentString,
      headerProfiles,
      this.hasCustomLocale,
      request,
      this.sessionId,
    );
    if (modifiedHeaders) request.requestHeaders = modifiedHeaders;
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
      'MediaDevices.prototype.enumerateDevices',
      'Notification.permission',
      'Permission.prototype.query',
      'WebGLRenderingContext.prototype.getParameter',
      'HTMLMediaElement.prototype.canPlayType',
      'RTCRtpSender.getCapabilities',
    ]);
    return Promise.all([
      this.setUserAgent(worker.devtoolsSession),
      ...scripts.map(x => worker.evaluate(x.script, true)),
    ]);
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

  protected loadDomOverrides(operatingSystemId: string): void {
    const domOverrides = this.domOverrides;

    domOverrides.add('Error.captureStackTrace');
    domOverrides.add('Error.constructor');

    const deviceMemory = Math.ceil(Math.random() * 4) * 2;
    domOverrides.add('navigator.deviceMemory', { memory: deviceMemory });
    domOverrides.add('navigator', {
      userAgentString: this.userAgentString,
      platform: this.osPlatform,
      headless: Chrome80.engine.isHeaded !== true,
    });

    domOverrides.add('MediaDevices.prototype.enumerateDevices', {
      videoDevice: {
        deviceId: randomBytes(32).toString('hex'),
        groupId: randomBytes(32).toString('hex'),
      },
    });

    domOverrides.add('Notification.permission');
    domOverrides.add('Permission.prototype.query');

    const windowChrome = windowChromeData.get(operatingSystemId);
    domOverrides.add('window.chrome', {
      updateLoadTimes: true,
      polyfill: {
        property: windowChrome.chrome,
        prevProperty: windowChrome.prevProperty,
      },
    });

    const domPolyfill = domPolyfillData.get(operatingSystemId);
    if (domPolyfill?.add?.length) {
      domOverrides.add('polyfill.add', {
        itemsToAdd: domPolyfill.add,
      });
    }
    if (domPolyfill?.remove?.length) {
      domOverrides.add('polyfill.remove', {
        itemsToRemove: domPolyfill.remove,
      });
    }
    if (domPolyfill?.modify?.length) {
      domOverrides.add('polyfill.modify', {
        itemsToModify: domPolyfill.modify,
      });
    }
    if (domPolyfill?.reorder?.length) {
      domOverrides.add('polyfill.reorder', {
        itemsToReorder: domPolyfill.reorder,
      });
    }

    const windowNavigator = windowNavigatorData.get(operatingSystemId);
    domOverrides.add('navigator.plugins', parseNavigatorPlugins(windowNavigator.navigator));
    domOverrides.add('WebGLRenderingContext.prototype.getParameter', {
      // UNMASKED_VENDOR_WEBGL
      37445: 'Intel Inc.',
      // UNMASKED_RENDERER_WEBGL
      37446: 'Intel Iris OpenGL Engine',
    });
    domOverrides.add('console.debug');
    domOverrides.add('HTMLIFrameElement.prototype');
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
        supportedCodecs: [
          ...agentCodecs.audioSupport.recordingFormats,
          ...agentCodecs.videoSupport.recordingFormats,
        ],
      });
      domOverrides.add('RTCRtpSender.getCapabilities', {
        videoCodecs: agentCodecs.webRtcVideoCodecs,
        audioCodecs: agentCodecs.webRtcAudioCodecs,
      });
    }
  }

  public static isMatch(meta: IUserAgentMatchMeta): boolean {
    if (!config.browserMatcher) return false;
    const matchName = (config.browserMatcher.name || '').toLowerCase();
    const matchVersionRange = config.browserMatcher.versionRange || [];
    const metaBrowser = meta.browser;
    if (metaBrowser.name !== matchName) return false;
    if (!matchVersionRange.length) return true;

    const minMajorVersion = Math.min(...matchVersionRange);
    const maxMajorVersion = Math.max(...matchVersionRange);

    return (
      metaBrowser.version.major >= minMajorVersion && metaBrowser.version.major <= maxMajorVersion
    );
  }
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
