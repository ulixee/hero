import {
  BrowserEmulatorClassDecorator,
  DataLoader,
  DnsOverTlsProviders,
  DomPolyfillLoader,
  DomOverridesBuilder,
  getEngine,
  getTcpSettingsForOs,
  modifyHeaders,
  parseNavigatorPlugins,
} from '@secret-agent/emulate-browsers-base';
import INetworkInterceptorDelegate from '@secret-agent/core-interfaces/INetworkInterceptorDelegate';
import IUserAgentMatchMeta from '@secret-agent/core-interfaces/IUserAgentMatchMeta';
import { randomBytes } from 'crypto';
import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';
import { pickRandom } from '@secret-agent/commons/utils';
import IWindowFraming from '@secret-agent/core-interfaces/IWindowFraming';
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
export default class Chrome87 {
  public static id = pkg.name;
  public static roundRobinPercent: number = config.marketshare;

  public static engine = getEngine(engineObj, config.browserEngine.executablePathEnvVar);

  public static dnsOverTlsConnectOptions = DnsOverTlsProviders.Cloudflare;

  public canPolyfill: boolean;

  public set locale(value: string) {
    this._locale = value;
    this.hasCustomLocale = true;
  }

  public get locale() {
    return this._locale;
  }

  public readonly userAgentString: string;
  public readonly osPlatform: string;

  public readonly networkInterceptorDelegate: INetworkInterceptorDelegate;
  public userProfile: IUserProfile;

  public windowFramingBase: IWindowFraming = windowFramingBase;
  public windowFraming: IWindowFraming;

  protected domOverrides = new DomOverridesBuilder();

  private _locale = 'en-US,en';
  private hasCustomLocale = false;

  constructor(matchMeta?: IUserAgentMatchMeta) {
    const userAgentOption = selectUserAgentOption(matchMeta);
    const windowNavigator = windowNavigatorData.get(userAgentOption.operatingSystemId);
    this.osPlatform = windowNavigator.navigator.platform._$value;
    this.userAgentString = userAgentOption.string;
    this.canPolyfill = !!domPolyfillData.get(userAgentOption.operatingSystemId);
    this.windowFraming = windowFramingData.get(userAgentOption.operatingSystemId);

    this.networkInterceptorDelegate = {
      tcp: getTcpSettingsForOs(userAgentOption.operatingSystemId),
      tls: {
        emulatorProfileId: 'Chrome87',
      },
      dns: {
        dnsOverTlsConnection: Chrome87.dnsOverTlsConnectOptions,
      },
      http: {
        requestHeaders: modifyHeaders.bind(
          this,
          userAgentOption.string,
          headerProfiles,
          this.hasCustomLocale,
        ),
      },
    };
    this.loadDomOverrides(userAgentOption.operatingSystemId);
  }

  public async newDocumentInjectedScripts() {
    return this.domOverrides.build();
  }

  public async newWorkerInjectedScripts() {
    const result = this.domOverrides.build([
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
      headless: Chrome87.engine.isHeaded !== true,
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

  public static isMatch(meta: IUserAgentMatchMeta) {
    if (!config.browserMatcher) return false;
    const matchName = (config.browserMatcher.name || '').toLowerCase();
    const matchVersionRange = config.browserMatcher.versionRange || [];
    const metaBrowser = meta.browser;
    if (metaBrowser.name !== matchName) return false;
    if (!matchVersionRange.length) return true;

    const minMajorVersion = Math.min(...matchVersionRange);
    const maxMajorVersion = Math.max(...matchVersionRange);

    return metaBrowser.version.major >= minMajorVersion && metaBrowser.version.major <= maxMajorVersion;
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
