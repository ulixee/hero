import {
  BrowserEmulatorClassDecorator,
  DnsOverTlsProviders,
  DomOverridesBuilder,
  getEngine,
  getTcpSettingsForOs,
  modifyHeaders,
  parseNavigatorPlugins
} from "@secret-agent/emulate-browsers-base";
import INetworkInterceptorDelegate from '@secret-agent/core-interfaces/INetworkInterceptorDelegate';
import IUserAgentMatchMeta from '@secret-agent/core-interfaces/IUserAgentMatchMeta';
import { randomBytes } from 'crypto';
import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';
import { pickRandom } from '@secret-agent/commons/utils';
import IWindowFraming from '@secret-agent/core-interfaces/IWindowFraming';
import AdvancedDataLoader from './lib/AdvancedDataLoader';
import * as pkg from './package.json';

const config = require('./config.json');

const headerProfilesData = new AdvancedDataLoader(`${__dirname}/data`, 'headers', false);
const userAgentOptionsData = new AdvancedDataLoader(`${__dirname}/data`, 'user-agent-options', false);
const windowFramingBaseData = new AdvancedDataLoader(`${__dirname}/data`, 'window-framing', false);

const windowFramingData = new AdvancedDataLoader(`${__dirname}/data`, 'window-framing', true);
const windowChromeData = new AdvancedDataLoader(`${__dirname}/data`, 'window-chrome', true);
const windowNavigatorData = new AdvancedDataLoader(`${__dirname}/data`, 'window-navigator', true);
const codecsData = new AdvancedDataLoader(`${__dirname}/data`, 'codecs', true);

const engineObj = {
  name: config.browserEngine.name,
  fullVersion: config.browserEngine.fullVersion,
};

const userAgentOptions = [].concat(...userAgentOptionsData.all);

@BrowserEmulatorClassDecorator
export default class ChromeAncient {
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

  public windowFramingBase: IWindowFraming;
  public windowFraming: IWindowFraming;

  public windowNavigator: any;
  public windowChrome: any;
  public agentCodecs: any;

  protected domOverrides = new DomOverridesBuilder();

  private _locale = 'en-US,en';
  private hasCustomLocale = false;

  constructor(matchMeta?: IUserAgentMatchMeta) {
    const userAgentOption = selectUserAgentOption(matchMeta);
    const { browserId, operatingSystemId } = userAgentOption;
    this.windowNavigator = windowNavigatorData.get(browserId, operatingSystemId);
    this.osPlatform = this.windowNavigator.navigator.platform._$value;
    this.userAgentString = userAgentOption.string;
    this.windowFramingBase = windowFramingBaseData.get(browserId);
    this.windowFraming = windowFramingData.get(browserId, operatingSystemId);
    this.windowChrome = windowChromeData.get(browserId, operatingSystemId);
    this.agentCodecs = codecsData.get(browserId, operatingSystemId);

    this.networkInterceptorDelegate = {
      tcp: getTcpSettingsForOs(userAgentOption.operatingSystemId),
      tls: {
        emulatorProfileId: 'Chrome80',
      },
      dns: {
        dnsOverTlsConnection: ChromeAncient.dnsOverTlsConnectOptions,
      },
      http: {
        requestHeaders: modifyHeaders.bind(
          this,
          userAgentOption.string,
          headerProfilesData.get(userAgentOption.browserId),
          this.hasCustomLocale,
        ),
      },
    };
    this.loadDomOverrides();
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

  protected loadDomOverrides() {
    const domOverrides = this.domOverrides;

    domOverrides.add('Error.captureStackTrace');
    domOverrides.add('Error.constructor');

    const deviceMemory = Math.ceil(Math.random() * 4) * 2;
    domOverrides.add('navigator.deviceMemory', { memory: deviceMemory });
    domOverrides.add('navigator', {
      userAgentString: this.userAgentString,
      platform: this.osPlatform,
    });

    domOverrides.add('MediaDevices.prototype.enumerateDevices', {
      videoDevice: {
        deviceId: randomBytes(32).toString('hex'),
        groupId: randomBytes(32).toString('hex'),
      },
    });

    domOverrides.add('Notification.permission');
    domOverrides.add('Permission.prototype.query');

    domOverrides.add('window.chrome', {
      updateLoadTimes: true,
      polyfill: {
        property: this.windowChrome.chrome,
        prevProperty: this.windowChrome.prevProperty,
      },
    });

    domOverrides.add('navigator.plugins', parseNavigatorPlugins(this.windowNavigator.navigator));
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

    const agentCodecs = this.agentCodecs;
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

    const minMajorVersion = Math.min(...matchVersionRange);
    const maxMajorVersion = Math.max(...matchVersionRange);

    return metaBrowser.version.major >= minMajorVersion && metaBrowser.version.major <= maxMajorVersion;
  }
}

function selectUserAgentOption(meta?: IUserAgentMatchMeta): any {
  if (!meta) return pickRandom(userAgentOptions);

  return pickRandom(userAgentOptionsData.get(meta.browser.id, meta.operatingSystem.id));
}
