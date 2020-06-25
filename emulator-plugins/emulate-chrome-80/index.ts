import { EmulatorPlugin, EmulatorPluginStatics, UserAgents } from '@secret-agent/emulators';
import IHttpRequestModifierDelegate from '@secret-agent/commons/interfaces/IHttpRequestModifierDelegate';
import headerProfiles from './headers.json';
import pkg from './package.json';
import modifyHeaders from '../shared/modifyHeaders';
import tcpVars from '../shared/tcpVars';
import codecs from './codecs.json';
import chrome from './chrome.json';
import defaultPolyfills from './polyfill.json';
import windows7Polyfills from './polyfill_windows_7_0.json';
import windows10Polyfills from './polyfill_windows_10_0.json';
import navigator from './navigator.json';
import chromePageOverrides from '../shared/chromePageOverrides';
import { randomBytes } from 'crypto';

@EmulatorPluginStatics
export default class Chrome80 extends EmulatorPlugin {
  public static emulatorId = pkg.name;
  public static browser = 'Chrome 80.0';
  public static chromiumEngines = [80];
  public static agents = UserAgents.getList({
    deviceCategory: 'desktop',
    vendor: 'Google Inc.',
    family: 'Chrome',
    versionMajor: 80,
  });

  public delegate: IHttpRequestModifierDelegate;

  constructor(os?: { family: string; major: string }) {
    const randomAgent = EmulatorPlugin.pickRandomUseragent(Chrome80.agents, os);
    super(randomAgent);
    this.delegate = {
      modifyHeadersBeforeSend: modifyHeaders.bind(this, this.userAgent, headerProfiles),
      tlsProfileId: 'Chrome72',
      tcpVars: tcpVars(os),
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
      defaultPolyfills,
      windows7Polyfills,
      windows10Polyfills,
      navigator,
    });
  }
}
