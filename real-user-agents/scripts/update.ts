import '@ulixee/commons/lib/SourceMapSupport';
import * as Fs from 'fs';
import { readFileAsJson } from '@ulixee/commons/lib/fileUtils';
import OsGenerator from '../data-generators/OsGenerator';
import BrowserGenerator from '../data-generators/BrowserGenerator';
import UserAgentGenerator from '../data-generators/UserAgentGenerator';
import { getDataFilePath } from '../lib/paths';
import BrowserMarketshareGenerator from '../data-generators/BrowserMarketshareGenerator';
import OsMarketshareGenerator from '../data-generators/OsMarketshareGenerator';
import loadData, { IStatcounterMarketshare } from '../data';
import importChromiumData from './importChromiumData';
import importDarwinToMacOsVersionMap from './importDarwinToMacOsVersionMap';
import updateStableChromeVersions from './updateStableChromeVersions';
import updateStatcounterData from './updateStatcounterData';
import importOsVersions from './importOsVersions';

export default async function update(): Promise<void> {
  await Promise.all([
    updateStatcounterData(),
    importChromiumData(),
    updateStableChromeVersions(),
    importDarwinToMacOsVersionMap(),
    importOsVersions(),
  ]);

  const data = await loadData();
  await OsGenerator.run(data);
  await BrowserGenerator.run(data);
  await UserAgentGenerator.run(data);

  const [browserVersions, osVersions, macVersions, winVersions] = await Promise.all([
    readStatcounterData('external-raw/statcounter/browser_version.json'),
    readStatcounterData('external-raw/statcounter/os_combined.json'),
    readStatcounterData('external-raw/statcounter/macos_version.json'),
    readStatcounterData('external-raw/statcounter/windows_version.json'),
  ]);
  const browserMarketshareGenerator = new BrowserMarketshareGenerator(browserVersions);
  const osMarketshareGenerator = new OsMarketshareGenerator({
    macVersions,
    osVersions,
    winVersions,
  });
  await saveMarketshare({
    byOsId: osMarketshareGenerator.toJSON(),
    byBrowserId: browserMarketshareGenerator.toJSON(),
  });
  // make sure to end
  process.exit();
}

function readStatcounterData(path: string): Promise<IStatcounterMarketshare> {
  return readFileAsJson<IStatcounterMarketshare>(getDataFilePath(path));
}

function saveMarketshare(marketshare: any): Promise<void> {
  const filePath = getDataFilePath('marketshare.json');
  return Fs.promises.writeFile(filePath, `${JSON.stringify(marketshare, null, 2)}\n`);
}

if (process.argv[2] === 'run') {
  update().catch(console.error);
}
