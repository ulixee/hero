import Emulators, {
  EmulatorPlugin,
  EmulatorPluginStatics,
  UserAgents,
} from '@secret-agent/emulators';
import IHttpRequestModifierDelegate from '@secret-agent/commons/interfaces/IHttpRequestModifierDelegate';
import {
  chromePageOverrides,
  getEngineExecutablePath,
  modifyHeaders,
  readPolyfills,
  tcpVars,
} from '@secret-agent/emulator-plugins-shared';
import { randomBytes } from 'crypto';
import { pickRandom } from '@secret-agent/emulators/lib/Utils';
import IUserAgent from '@secret-agent/emulators/interfaces/IUserAgent';
import defaultAgents from './user-agents.json';
import navigator from './navigator.json';
import chrome from './chrome.json';
import codecs from './codecs.json';
import pkg from './package.json';
import headerProfiles from './headers.json';

const polyfills = readPolyfills(__dirname);
const engineExecutablePath = process.env.CHROME_83_BIN ?? getEngineExecutablePath(pkg.engine);

@EmulatorPluginStatics
export default class Chrome83 extends EmulatorPlugin {
  public static emulatorId = pkg.name;
  public static statcounterBrowser = 'Chrome 83.0';
  public static engine = pkg.engine;

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

  public engine = pkg.engine;
  public get engineExecutablePath() {
    return engineExecutablePath;
  }

  public get canPolyfill() {
    return polyfills?.canPolyfill(this);
  }

  public readonly userAgent: IUserAgent;
  public delegate: IHttpRequestModifierDelegate;

  constructor(userAgent?: IUserAgent) {
    super();
    this.userAgent = userAgent ?? pickRandom(Chrome83.agents);
    this.delegate = {
      modifyHeadersBeforeSend: modifyHeaders.bind(this, this.userAgent, headerProfiles),
      tlsProfileId: 'Chrome83',
      tcpVars: tcpVars(this.userAgent.os),
    };
  }

  public async generatePageOverrides() {
    const args = {
      osFamily: this.userAgent.os.family,
      osVersion: `${this.userAgent.os.major}.${this.userAgent.os.minor}`,
      platform: this.userAgent.platform,
      memory: Math.ceil(Math.random() * 4) * 2,
      languages: ['en-US', 'en'],
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
Emulators.load(Chrome83);
