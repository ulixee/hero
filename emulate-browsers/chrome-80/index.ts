import INetworkInterceptorDelegate from '@secret-agent/core-interfaces/INetworkInterceptorDelegate';
import {
  BrowserEmulatorClassDecorator,
  chromePageOverrides,
  DnsOverTlsProviders,
  getEngineExecutablePath,
  getTcpSettingsForOs,
  IUserAgent,
  modifyHeaders,
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

const polyfills = readPolyfills(__dirname);
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
    return polyfills?.canPolyfill(this);
  }

  public readonly userAgent: IUserAgent;
  public readonly networkInterceptorDelegate: INetworkInterceptorDelegate;
  public locale = 'en-US,en;0.9';
  public userProfile: IUserProfile;

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
  }

  public async generatePageOverrides() {
    const os = this.userAgent.os;
    const osFamilyLower = os.family.match(/mac/i) ? 'mac-os-x' : 'windows';
    const windowFrame = frame[osFamilyLower] ?? frame[`${osFamilyLower}-${os.major}`];

    const args = {
      osFamily: os.family,
      osVersion: `${os.major}.${os.minor}`,
      platform: this.userAgent.platform,
      memory: Math.ceil(Math.random() * 4) * 2,
      languages: this.locale.split(','),
      windowFrame,
      videoDevice: {
        // TODO: stabilize per user
        deviceId: randomBytes(32).toString('hex'),
        groupId: randomBytes(32).toString('hex'),
      },
    };

    // import scripts from single file
    return chromePageOverrides(args, {
      codecs,
      chrome,
      polyfills: polyfills.get(this),
      navigator,
    });
  }
}
