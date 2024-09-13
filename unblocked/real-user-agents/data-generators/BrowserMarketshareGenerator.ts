import { createBrowserId } from '../lib/BrowserUtils';
import { IStatcounterMarketshare } from '../data';

export default class BrowserMarketshareGenerator {
  private readonly byId: { [id: string]: number } = {};

  constructor(browserVersions: IStatcounterMarketshare) {
    for (const [rawBrowserString, rawValues] of Object.entries(browserVersions.results)) {
      const matches = rawBrowserString.match(/^([a-z\s]+)\s([\d.]+)/i);
      if (!matches) {
        console.warn(`Could not parse browser string: ${rawBrowserString}`);
        continue;
      }
      const name = matches[1].trim();
      const versionString = matches[2];
      const versionArray = versionString.split('.');
      if (versionArray.length === 1) versionArray.push('0');

      const [major, minor] = versionArray;
      const browserId = createBrowserId({ name, version: { major, minor } });
      this.byId[browserId] = averagePercent((rawValues as string[]).map(v => Number(v)));
    }
  }

  public get(key: string): number {
    return this.byId[key] || 0;
  }

  public toJSON(): object {
    return { ...this.byId };
  }
}

// HELPER FUNCTIONS

function averagePercent(counts: number[]): number {
  const avg = Math.round((10 * counts.reduce((tot, vl) => tot + vl, 0)) / counts.length);
  return avg / 10;
}
