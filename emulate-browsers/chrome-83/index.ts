import IHttpRequestModifierDelegate from '@secret-agent/commons/interfaces/IHttpRequestModifierDelegate';
import {
  BrowserEmulatorClassDecorator,
  chromePageOverrides,
  getEngineExecutablePath,
  IUserAgent,
  modifyHeaders,
  readPolyfills,
  tcpVars,
  UserAgents,
} from '@secret-agent/emulate-browsers-base';
import { randomBytes } from 'crypto';
import { pickRandom } from '@secret-agent/commons/utils';
import { ConnectionOptions } from 'tls';
import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';
import defaultAgents from './user-agents.json';
import navigator from './navigator.json';
import chrome from './chrome.json';
import codecs from './codecs.json';
import pkg from './package.json';
import headerProfiles from './headers.json';
import frame from './frame.json';

const polyfills = readPolyfills(__dirname);
const engineExecutablePath = process.env.CHROME_83_BIN ?? getEngineExecutablePath(pkg.engine);

@BrowserEmulatorClassDecorator
export default class Chrome83 {
  public static id = pkg.name;
  public static statcounterBrowser = 'Chrome 83.0';
  public static engine = pkg.engine;
  public static dnsOverTlsConnectOptions = <ConnectionOptions>{
    host: '1.1.1.1',
    servername: 'cloudflare-dns.com',
  };

  protected static agents = UserAgents.getList(
    {
      deviceCategory: 'desktop',
      vendor: 'Google Inc.',
      family: 'Chrome',
      versionMajor: 83,
      operatingSystems: [
        {
          family: 'Windows',
        },
        {
          family: 'Mac OS X',
        },
      ],
    },
    defaultAgents,
  );

  public get canPolyfill() {
    return polyfills?.canPolyfill(this);
  }

  public engineExecutablePath = engineExecutablePath;
  public engine = pkg.engine;
  public locale = 'en-US';
  public userProfile: IUserProfile;
  public readonly userAgent: IUserAgent;
  public delegate: IHttpRequestModifierDelegate;

  constructor(userAgent?: IUserAgent) {
    this.userAgent = userAgent ?? pickRandom(Chrome83.agents);
    this.delegate = {
      modifyHeadersBeforeSend: modifyHeaders.bind(this, this.userAgent, headerProfiles),
      tlsProfileId: 'Chrome83',
      tcpVars: tcpVars(this.userAgent.os),
      dnsOverTlsConnectOptions: Chrome83.dnsOverTlsConnectOptions,
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
