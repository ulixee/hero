import { readFileAsJson } from '@ulixee/commons/lib/fileUtils';
import { getDataFilePath } from '../lib/paths';
import IStableChromeVersion from '../interfaces/IStableChromeVersion';

export default async function loadData(): Promise<IRealUserAgentsData> {
  const datafiles = Object.entries({
    userAgents: readJsonFile('external-raw/browserstack/userAgents.json'),
    chromiumBuildVersions: readJsonFile('chromiumBuildVersions.json'),
    stableChromeVersions: readJsonFile('stableChromeVersions.json'),
    browserDescriptions: readJsonFile(`manual/browserDescriptions.json`),
    browserReleaseDates: readJsonFile(`manual/browserReleaseDates.json`),
    osDescriptions: readJsonFile(`manual/osDescriptions.json`),
    osReleaseDates: readJsonFile(`manual/osReleaseDates.json`),
    marketshare: readJsonFile(`marketshare.json`),
    windowsPlatformVersions: readJsonFile('manual/windowsUniversalApiMap.json'),
    darwinToMacOsVersionMap: readJsonFile(`os-mappings/darwinToMacOsVersionMap.json`),
    macOsNameToVersionMap: readJsonFile(`os-mappings/macOsNameToVersionMap.json`),
    macOsVersionAliasMap: readJsonFile(`os-mappings/macOsVersionAliasMap.json`),
    winOsNameToVersionMap: readJsonFile(`os-mappings/winOsNameToVersionMap.json`),
    windowsToWindowsVersionMap: readJsonFile(`os-mappings/windowsToWindowsVersionMap.json`),
  });
  const data: IRealUserAgentsData = {} as any;
  await Promise.all(
    datafiles.map(async ([key, dataPromise]) => {
      data[key] = await dataPromise;
    }),
  );
  return data;
}

function readJsonFile(path: string): Promise<any> {
  return readFileAsJson(getDataFilePath(path));
}

export interface IRealUserAgentsData {
  userAgents: { id: string; string: string; osId: string }[];
  chromiumBuildVersions: string[];
  stableChromeVersions: IStableChromeVersion[];
  windowsPlatformVersions: { [osId: string]: string };
  browserReleaseDates: IReleaseDates;
  browserDescriptions: { [name: string]: string };
  osReleaseDates: IReleaseDates;
  osDescriptions: { [name: string]: string };
  marketshare: {
    byOsId: { [osId: string]: number };
    byBrowserId: { [browserId: string]: number };
  };
  darwinToMacOsVersionMap: { [version: string]: string };
  macOsNameToVersionMap: { [name: string]: string };
  macOsVersionAliasMap: { [version: string]: string };
  winOsNameToVersionMap: { [name: string]: string };
  windowsToWindowsVersionMap: { [version: string]: string };
}

export interface IReleaseDates {
  [key: string]: string;
}

export interface IStatcounterMarketshare {
  fromMonthYear: string;
  toMonthYear: string;
  lastModified: string;
  results: {
    [key: string]: [lastMonth: string, thisMonth: string];
  };
}
