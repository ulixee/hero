import * as Fs from 'fs';
import { compareVersions } from 'compare-versions';
import IUserAgent from '../interfaces/IUserAgent';
import { createBrowserId } from '../lib/BrowserUtils';
import Browsers from '../lib/Browsers';
import extractUserAgentMeta from '../lib/extractUserAgentMeta';
import { IRealUserAgentsData } from '../data';
import OperatingSystems from '../lib/OperatingSystems';
import UserAgent from '../lib/UserAgent';
import findUaClientHintsPlatformVersion from '../lib/findUaClientHintsPlatformVersion';

export default class UserAgentGenerator {
  public static async run(data: IRealUserAgentsData): Promise<void> {
    const byId: { [id: string]: IUserAgent } = {};

    const idSortInfo: {
      [id: string]: [
        osName: string,
        osMajor: number,
        osMinor: number,
        browserName: string,
        browserMajor: number,
        browserMinor: number,
      ];
    } = {};

    for (const value of data.userAgents) {
      const userAgentString = value.string;
      const { name, version } = extractUserAgentMeta(userAgentString);
      const browserId = createBrowserId({ name, version });
      const osId = value.osId;
      const [osName, osVersionMajor, osVersionMinor] = osId.replace('mac-os', 'mac').split('-');
      const userAgentId = `${osId}--${browserId}`;
      let allPatchVersions: number[] = [];
      let stablePatchVersions: number[] = [];
      let uaClientHintsPlatformVersions: string[] = [];
      let pattern = userAgentString;
      let browserVersion = version;

      if (name === 'Chrome') {
        const chromeVersion = data.stableChromeVersions.find(x => x.id === browserId);
        if (chromeVersion) {
          browserVersion = {
            major: String(chromeVersion.majorVersion),
            minor: '0',
            build: String(chromeVersion.buildVersion ?? ''),
          };
        }

        allPatchVersions = this.getAllPatches(data, version.major);
        stablePatchVersions = this.getStablePatches(data, browserId, osName);

        const regexp = /Chrome\/([0-9]+.[0-9]+.[0-9]+.([0-9]+))/;
        const userAgentMatches = userAgentString.match(regexp);
        const fullUa = userAgentMatches[1];
        const buildVersion = userAgentMatches[2];
        if (buildVersion && buildVersion !== '0') {
          const buildNumber = Number(buildVersion);
          if (!stablePatchVersions.includes(buildNumber)) stablePatchVersions.push(buildNumber);

          if (stablePatchVersions.length) {
            pattern = userAgentString.replace(
              `/${fullUa}`,
              `/${version.major}.${version.minor}.${version.build}.$patch$`,
            );
          }
        }

        if (Number(version.major) > 89) {
          uaClientHintsPlatformVersions = findUaClientHintsPlatformVersion(osId);
          if (
            uaClientHintsPlatformVersions.length &&
            osId.startsWith('mac') &&
            !userAgentString.includes('10_15_7')
          ) {
            pattern = pattern.replace('10_15_7', '$osVersion$');
          }
        }
      }

      const browserIdParts = browserId.split('-');

      idSortInfo[userAgentId] = [
        osName,
        Number(osVersionMajor),
        Number(osVersionMinor ?? 0),
        browserIdParts[0],
        Number(browserIdParts[1]),
        Number(browserIdParts[2] ?? 0),
      ];
      byId[userAgentId] = {
        id: userAgentId,
        allPatchVersions,
        stablePatchVersions,
        browserBaseVersion: [
          Number(browserVersion.major),
          Number(browserVersion.minor),
          browserVersion.build !== undefined ? Number(browserVersion.build) : undefined,
          browserVersion.patch !== undefined ? Number(browserVersion.patch) : undefined,
        ],
        uaClientHintsPlatformVersions,
        operatingSystemVersion: { major: osVersionMajor, minor: osVersionMinor },
        operatingSystemId: osId,
        pattern,
        browserId,
        marketshare: 0,
      };
    }

    for (const browser of Object.values(Browsers.all())) {
      const userAgents = Object.values(byId).filter(x => x.browserId === browser.id);
      const osPercentTotal = userAgents.reduce((total, x) => {
        return total + OperatingSystems.byId(x.operatingSystemId).marketshare;
      }, 0);
      for (const userAgent of userAgents) {
        const os = OperatingSystems.byId(userAgent.operatingSystemId);
        const percentOfOsTraffic = os ? os.marketshare / osPercentTotal : 0;
        userAgent.marketshare = Math.floor(browser.marketshare * percentOfOsTraffic * 100) / 100;
      }
    }

    const values = Object.entries(byId).sort(([, a], [, b]) => {
      const aSort = idSortInfo[a.id];
      const bSort = idSortInfo[b.id];
      for (let i = 0; i < aSort.length; i += 1) {
        if (aSort[i] === bSort[i]) continue;
        if (typeof aSort[i] === 'number') return (bSort[i] as number) - (aSort[i] as number);
        return (aSort[i] as string).localeCompare(bSort[i] as string);
      }
      return 0;
    });
    const entry = Object.fromEntries(values);
    await Fs.promises.writeFile(UserAgent.filePath, `${JSON.stringify(entry, null, 2)}\n`);
  }

  private static getAllPatches(data: IRealUserAgentsData, majorVersion: string): number[] {
    let buildVersions = data.chromiumBuildVersions.filter(x => x.startsWith(`${majorVersion}.0`));
    buildVersions = buildVersions.sort(compareVersions).slice(-10).reverse();

    return buildVersions.map(x => x.split('.').pop()).map(Number);
  }

  private static getStablePatches(
    data: IRealUserAgentsData,
    browserId: string,
    osName: string,
  ): number[] {
    const chromeVersion = data.stableChromeVersions.find(x => x.id === browserId);
    if (!chromeVersion) return [];
    if (osName.toLowerCase() === 'windows') return chromeVersion.stablePatchesByOs.win;
    if (osName.toLowerCase().startsWith('mac')) return chromeVersion.stablePatchesByOs.mac;
    return [];
  }
}
