import IOperatingSystemVersion from '../interfaces/IOperatingSystemVersion';
import { createOsId, createOsName, createOsVersion } from '../lib/OsUtils';
import { IStatcounterMarketshare } from '../data';

export default class OsMarketshareGenerator {
  private readonly byId: { [key: string]: number } = {};

  constructor(statcounter: {
    osVersions: IStatcounterMarketshare;
    macVersions: IStatcounterMarketshare;
    winVersions: IStatcounterMarketshare;
  }) {
    const { macVersions, osVersions, winVersions } = statcounter;
    const macPct = averagePercent(osVersions.results['OS X'].map(s => Number(s)));
    for (const [rawOsString, rawValues] of Object.entries(macVersions.results)) {
      const id = extractOsId(rawOsString);
      this.byId[id] = extractMarketshare(rawValues, macPct);
    }

    const winPct = averagePercent(osVersions.results.Windows.map(s => Number(s)));
    for (const [rawOsString, rawValues] of Object.entries(winVersions.results)) {
      const id = extractOsId(rawOsString);
      this.byId[id] = extractMarketshare(rawValues, winPct);
    }
  }

  public get(key: string): number {
    return this.byId[key];
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

function extractOsId(rawOsString: string): string {
  const osString = cleanOsString(rawOsString);
  const name = createOsName(osString);
  const version = extractVersion(osString, name);
  return createOsId({ name, version });
}

function extractMarketshare(rawValues: string[], osPct: number): number {
  const percents = rawValues.map(x => (Number(x) * osPct) / 100);
  return averagePercent(percents);
}

function cleanOsString(osString: string): string {
  return osString
    .replace('macOS', 'OS X')
    .replace('mac OS X', 'OS X')
    .replace('OS X 10.15', 'OS X Catalina');
}

function extractVersion(osString: string, osName: string): IOperatingSystemVersion {
  const versionString = osString.replace('Win', '').replace('OS X', '').trim();

  if (versionString === 'Other') {
    return {
      name: versionString,
      major: '0',
      minor: '0',
    };
  }

  const [majorVersion, minorVersion] = versionString.split('.');
  return createOsVersion(osName, majorVersion, minorVersion);
}
