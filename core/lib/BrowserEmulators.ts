import { UAParser } from 'ua-parser-js';
import IBrowserEmulatorClass from '@secret-agent/core-interfaces/IBrowserEmulatorClass';
import ChromeLatest from '@secret-agent/emulate-chrome-latest';
import { pickRandom } from '@secret-agent/commons/utils';
import IUserAgentMatchMeta from '@secret-agent/core-interfaces/IUserAgentMatchMeta';
import IBrowserEmulatorConfiguration from '@secret-agent/core-interfaces/IBrowserEmulatorConfiguration';
import GlobalPool from './GlobalPool';

export default class BrowserEmulators {
  public static defaultId = ChromeLatest.id;

  public static get emulatorIds(): string[] {
    return Object.keys(this.emulatorsById);
  }

  private static readonly emulatorsById: { [emulatorId: string]: IBrowserEmulatorClass } = {};

  private static readonly emulatorPublicUsageDistribution: string[] = [];

  public static load(BrowserEmulatorClass: IBrowserEmulatorClass) {
    if (this.emulatorsById[BrowserEmulatorClass.id]) return;
    this.emulatorsById[BrowserEmulatorClass.id] = BrowserEmulatorClass;

    const usagePct = BrowserEmulatorClass.roundRobinPercent ?? 1;
    for (let i = 0; i < usagePct; i += 1) {
      this.emulatorPublicUsageDistribution.push(BrowserEmulatorClass.id);
    }
  }

  public static getClassById(id: string) {
    let BrowserEmulator = this.emulatorsById[id];
    BrowserEmulator = BrowserEmulator || this.tryRequireClass(`@secret-agent/emulate-${id}`);
    BrowserEmulator = BrowserEmulator || this.tryRequireClass(id);
    return BrowserEmulator;
  }

  public static createInstance(options: IBrowserEmulatorConfiguration, tmpId?: string) {
    const id = this.getId(tmpId);
    let BrowserEmulator = this.getClassById(id);
    if (BrowserEmulator) return new BrowserEmulator(options);

    const uaParser = new UAParser(id);
    const uaBrowser = uaParser.getBrowser();
    const uaOs = uaParser.getOS();
    if (uaBrowser.name) {
      const matchMeta = this.extractUserAgentMatchMetaFromUa(uaBrowser, uaOs);
      BrowserEmulator = this.requireClassFromMatchMeta(matchMeta);
      return new BrowserEmulator(options, matchMeta);
    }

    throw new Error(`BrowserEmulator was not found: ${id}`);
  }

  public static getId(tmpId: string) {
    if (!tmpId) {
      return GlobalPool.defaultBrowserEmulatorId;
    }
    if (tmpId === 'random') {
      return this.getRandomId();
    }
    return tmpId;
  }

  public static getRandomId(): string {
    return pickRandom(this.emulatorPublicUsageDistribution);
  }

  private static tryRequireClass(packageName: string) {
    try {
      // eslint-disable-next-line global-require,import/no-dynamic-require
      const BrowserEmulator = require(packageName)?.default;
      this.load(BrowserEmulator);
      return BrowserEmulator;
    } catch (e) {
      return undefined;
    }
  }

  private static extractUserAgentMatchMetaFromUa(
    uaBrowser: UAParser.IBrowser,
    uaOs: UAParser.IOS,
  ): IUserAgentMatchMeta {
    const [browserVersionMajor, browserVersionMinor] = uaBrowser.version
      .split('.')
      .map(x => Number(x));
    const [osVersionMajor, osVersionMinor] = uaOs.version.split('.').map(x => Number(x));
    const browserName = (uaBrowser.name || '').toLowerCase();
    const browserId = `${browserName}-${browserVersionMajor}-${browserVersionMinor}`;
    const osName = (uaOs.name || '').toLowerCase();

    let osId = [osName.replace(' ', '-'), osVersionMajor, osVersionMinor].filter(x => x).join('-');
    osId = osId.replace('mac-os-10-16', 'mac-os-11');

    return {
      browser: {
        id: browserId,
        name: browserName,
        version: { major: browserVersionMajor, minor: browserVersionMinor },
      },
      operatingSystem: {
        id: osId,
        name: osName,
        version: { major: osVersionMajor, minor: osVersionMinor },
      },
    };
  }

  private static requireClassFromMatchMeta(matchMeta: IUserAgentMatchMeta) {
    for (const BrowserEmulator of Object.values(this.emulatorsById)) {
      if (BrowserEmulator.isMatch(matchMeta)) {
        return BrowserEmulator;
      }
    }

    const matchBrowser = matchMeta.browser;
    const matchOs = matchMeta.operatingSystem;
    const matchBrowserString = `${matchBrowser.name} ${matchBrowser.version.major}.${matchBrowser.version.minor}`;
    const matchOsString = `${matchOs.name} ${matchOs.version.major}.${matchOs.version.minor}`;
    throw new Error(`BrowserEmulator was not found for ${matchBrowserString} on ${matchOsString}`);
  }
}
