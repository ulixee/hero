import IBrowserEmulatorClass from '@secret-agent/core-interfaces/IBrowserEmulatorClass';
import { pickRandom } from '@secret-agent/commons/utils';
import GlobalPool from './GlobalPool';

export default class BrowserEmulators {
  public static get emulatorIds(): string[] {
    return Object.keys(this.emulatorsById);
  }

  private static readonly emulatorsById: { [emulatorId: string]: IBrowserEmulatorClass } = {};

  private static readonly emulatorPublicUsageDistribution: string[] = [];

  public static load(BrowserEmulatorClass: IBrowserEmulatorClass) {
    this.emulatorsById[BrowserEmulatorClass.id] = BrowserEmulatorClass;

    const usagePct = BrowserEmulatorClass.roundRobinPercent ?? 1;
    for (let i = 0; i < usagePct; i += 1) {
      this.emulatorPublicUsageDistribution.push(BrowserEmulatorClass.id);
    }
  }

  public static getClass(browserEmulatorId: string) {
    let BrowserEmulator = this.emulatorsById[browserEmulatorId];
    if (!BrowserEmulator) {
      const fromShortId = `@secret-agent/emulate-${browserEmulatorId}`;
      try {
        // eslint-disable-next-line global-require,import/no-dynamic-require
        BrowserEmulator = require(fromShortId)?.default;
      } catch (err) {
        // try as full package name
        // eslint-disable-next-line global-require,import/no-dynamic-require
        BrowserEmulator = require(browserEmulatorId)?.default;
      }
      if (BrowserEmulator) this.load(BrowserEmulator);
    }
    if (!BrowserEmulator) {
      throw new Error(`BrowserEmulator could not be found: ${browserEmulatorId}`);
    }
    return BrowserEmulator;
  }

  public static getId(emulatorId?: string) {
    if (!emulatorId) {
      return GlobalPool.defaultBrowserEmulatorId;
    }
    if (emulatorId === 'random') {
      return this.getRandomId();
    }
    return emulatorId;
  }

  public static getRandomId(): string {
    return pickRandom(this.emulatorPublicUsageDistribution);
  }
}
