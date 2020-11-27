import INetworkInterceptorDelegate from '@secret-agent/core-interfaces/INetworkInterceptorDelegate';
import {
  BrowserEmulatorClassDecorator,
  DnsOverTlsProviders,
  DomOverridesBuilder,
  getEngineExecutablePath,
  getTcpSettingsForOs,
  modifyHeaders,
  parseNavigatorPlugins,
  DataLoader,
  DomDiffLoader,
} from '@secret-agent/emulate-browsers-base';
import IUserAgentOption from '@secret-agent/core-interfaces/IUserAgentOption';
import { randomBytes } from 'crypto';
import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';
import { pickRandom } from '@secret-agent/commons/utils';
import IWindowFraming from "@secret-agent/core-interfaces/IWindowFraming";
import pkg from './package.json';
import headerProfiles from './data/headers.json';
import userAgentOptions from './data/user-agent-options.json';
import config from './data/config.json';
import windowFramingBase from './data/window-framing.json';

const windowFramingData = new DataLoader(`${__dirname}/data`, 'window-framing');
const windowChromeData = new DataLoader(`${__dirname}/data`, 'window-chrome');
const windowNavigatorData = new DataLoader(`${__dirname}/data`, 'window-navigator');
const codecsData = new DataLoader(`${__dirname}/data`, 'codecs');
const domDiffsData = new DomDiffLoader(`${__dirname}/data`);

@BrowserEmulatorClassDecorator
export default class Chrome80 {
  public static id = pkg.name;
  public static roundRobinPercent: number = (config as any).marketshare;

  public static engine = {
    ...pkg.engine,
    executablePath: process.env.CHROME_83_BIN ?? getEngineExecutablePath(pkg.engine),
  };

  public static dnsOverTlsConnectOptions = DnsOverTlsProviders.Cloudflare;

  public canPolyfill: boolean;

  public set locale(value: string) {
    this._locale = value;
    this.hasCustomLocale = true;
  }

  public get locale() {
    return this._locale;
  }

  public readonly navigatorUserAgent: string;
  public readonly navigatorPlatform: string;

  public readonly networkInterceptorDelegate: INetworkInterceptorDelegate;
  public userProfile: IUserProfile;

  public windowFramingBase: IWindowFraming = windowFramingBase;
  public windowFraming: IWindowFraming;

  protected domOverrides = new DomOverridesBuilder();

  private _locale = 'en-US,en';
  private hasCustomLocale = false;

  constructor() {
    const userAgentOption = pickRandom(
      (this.constructor as any).userAgentOptions as IUserAgentOption[],
    );
    const windowNavigator = windowNavigatorData.get(userAgentOption.operatingSystemId);
    this.navigatorPlatform = windowNavigator.navigator.platform._$value;
    this.navigatorUserAgent = userAgentOption.string;
    this.canPolyfill = !!domDiffsData.get(userAgentOption.operatingSystemId);
    this.windowFraming = windowFramingData.get(userAgentOption.operatingSystemId);

    this.networkInterceptorDelegate = {
      tcp: getTcpSettingsForOs(userAgentOption.operatingSystemId),
      tls: {
        emulatorProfileId: 'Chrome80',
      },
      dns: {
        dnsOverTlsConnection: Chrome80.dnsOverTlsConnectOptions,
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

  protected loadDomOverrides(operatingSystemId: string) {
    const domOverrides = this.domOverrides;

    domOverrides.add('Error.captureStackTrace');
    domOverrides.add('Error.constructor');

    domOverrides.add('navigator.webdriver');

    const deviceMemory = Math.ceil(Math.random() * 4) * 2;
    domOverrides.add('navigator.deviceMemory', { memory: deviceMemory });

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

    const polyfills = domDiffsData.get(operatingSystemId);
    if (polyfills?.removals?.length) {
      domOverrides.add('polyfill.removals', {
        removals: polyfills.removals,
      });
    }
    if (polyfills?.additions?.length) {
      domOverrides.add('polyfill.additions', {
        additions: polyfills.additions,
      });
    }
    if (polyfills?.changes?.length) {
      domOverrides.add('polyfill.changes', {
        changes: polyfills.changes,
      });
    }
    if (polyfills?.order?.length) {
      domOverrides.add('polyfill.reorder', {
        order: polyfills.order,
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

    domOverrides.add('window.outerWidth', { frameBorderWidth: this.windowFraming.frameBorderWidth });
    domOverrides.add('window.outerHeight', { frameBorderHeight: this.windowFraming.frameBorderHeight });

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
  }

  public static get userAgentOptions() {
    return userAgentOptions;
  }
}
