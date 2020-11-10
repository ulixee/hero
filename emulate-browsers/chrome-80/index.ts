import INetworkInterceptorDelegate from '@secret-agent/core-interfaces/INetworkInterceptorDelegate';
import {
  BrowserEmulatorClassDecorator,
  DnsOverTlsProviders,
  DomOverridesBuilder,
  getEngineExecutablePath,
  getTcpSettingsForOs,
  IUserAgent,
  modifyHeaders,
  parseNavigatorPlugins,
  readPolyfills,
  StatcounterBrowserUsage,
} from '@secret-agent/emulate-browsers-base';
import { randomBytes } from 'crypto';
import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';
import UserAgents from '@secret-agent/emulate-browsers-base/lib/UserAgents';
import { pickRandom } from '@secret-agent/commons/utils';
import navigator from './navigator.json';
import chrome from './chrome.json';
import codecs from './codecs.json';
import pkg from './package.json';
import headerProfiles from './headers.json';
import defaultUseragents from './user-agents.json';
import frame from './frame.json';

const polyfillSet = readPolyfills(__dirname);
const agents = UserAgents.getSupportedAgents('Chrome', 80, defaultUseragents);

@BrowserEmulatorClassDecorator
export default class Chrome80 {
  public static id = pkg.name;
  public static roundRobinPercent = StatcounterBrowserUsage.getConsumerUsageForBrowser(
    'Chrome 80.0',
  );

  public static engine = {
    ...pkg.engine,
    executablePath: process.env.CHROME_83_BIN ?? getEngineExecutablePath(pkg.engine),
  };

  public static dnsOverTlsConnectOptions = DnsOverTlsProviders.Cloudflare;

  public get canPolyfill() {
    return polyfillSet?.canPolyfill(this);
  }

  public readonly userAgent: IUserAgent;
  public readonly networkInterceptorDelegate: INetworkInterceptorDelegate;
  public locale = 'en-US,en;0.9';
  public userProfile: IUserProfile;

  protected domOverrides = new DomOverridesBuilder();

  constructor(userAgent?: IUserAgent) {
    this.userAgent = userAgent ?? pickRandom(agents);
    this.networkInterceptorDelegate = {
      tcp: getTcpSettingsForOs(this.userAgent.os),
      tls: {
        emulatorProfileId: 'Chrome80',
      },
      dns: {
        dnsOverTlsConnection: Chrome80.dnsOverTlsConnectOptions,
      },
      http: {
        requestHeaders: modifyHeaders.bind(this, this.userAgent, headerProfiles),
      },
    };
    this.loadDomOverrides();
  }

  public async newDocumentInjectedScripts() {
    return this.domOverrides.build();
  }

  protected loadDomOverrides() {
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

    domOverrides.add('window.chrome', {
      updateLoadTimes: true,
      polyfill: {
        property: chrome.chrome,
        prevProperty: chrome.prevProperty,
      },
    });

    const polyfills = polyfillSet.get(this);
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

    domOverrides.add('navigator.plugins', parseNavigatorPlugins(navigator.navigator));
    domOverrides.add('WebGLRenderingContext.prototype.getParameter', {
      // UNMASKED_VENDOR_WEBGL
      37445: 'Intel Inc.',
      // UNMASKED_RENDERER_WEBGL
      37446: 'Intel Iris OpenGL Engine',
    });
    domOverrides.add('console.debug');
    domOverrides.add('HTMLIFrameElement.prototype');
    domOverrides.add('Element.prototype.attachShadow');

    domOverrides.add('window.outerWidth');

    const windowFrame = this.getFrameHeight();
    if (windowFrame) {
      domOverrides.add('window.outerHeight', {
        windowFrame,
      });
    }

    const agentCodecs = this.getCodecs();
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

  private getFrameHeight() {
    const os = this.userAgent.os;
    const osFamilyLower = os.family.match(/mac/i) ? 'mac-os-x' : 'windows';
    return frame[osFamilyLower] ?? frame[`${osFamilyLower}-${os.major}`];
  }

  private getCodecs() {
    const os = this.userAgent.os;
    let osCodecs = codecs.find(x => x.opSyses.includes(`${os.family} ${os.major}`));
    if (!osCodecs) {
      // just match on os
      osCodecs = codecs.find(x => x.opSyses.some(y => y.includes(os.family)));
    }
    return osCodecs?.profile;
  }
}
