import * as Fs from 'fs';
import * as Path from 'path';
import IDomProfile, {
  IProfileDataByProtocol,
} from '@double-agent/collect-browser-dom-environment/interfaces/IProfile';
import IDomPolyfill from '@unblocked-web/specifications/plugin/IDomPolyfill';
import BrowserProfiler from '@unblocked-web/browser-profiler';
import DomBridger from '@unblocked-web/browser-profiler-dom-bridger';
import IBaseProfile from '@double-agent/collect/interfaces/IBaseProfile';
import generatePolyfill from '../generatePolyfill';
import Config from './Config';
import EmulatorData from '../EmulatorData';

const browserstackProfilesDir = Path.join(BrowserProfiler.dataDir, 'profiled-doms/browserstack');
const localProfilesDir = Path.join(BrowserProfiler.dataDir, 'profiled-doms/local');

function log(message: string, ...args: any[]): void {
  // eslint-disable-next-line no-console
  console.log(message, ...args);
}

export default class DomPolyfillJson {
  private readonly dataMap: { [osId: string]: { [osId: string]: IDomPolyfill } } = {};

  constructor(config: Config, userAgentIds: string[]) {
    if (!config.browserEngineOption) return;
    const foundationDomsByOsId = getFoundationDoms(config.browserId);

    for (const userAgentId of userAgentIds) {
      const profile = BrowserProfiler.getProfile<IBaseProfile<IProfileDataByProtocol>>(
        'browser-dom-environment',
        userAgentId,
      );
      const { operatingSystemId: emulateOsId } =
        BrowserProfiler.extractMetaFromUserAgentId(userAgentId);
      for (const runtimeOsId of Object.keys(foundationDomsByOsId)) {
        const foundationDom = foundationDomsByOsId[runtimeOsId];
        const polyfill = generatePolyfill(foundationDom, profile.data.https);

        // apply devtools, browserstack, headless indicator removes
        DomBridger.removeDevtoolsFromPolyfill(polyfill);
        DomBridger.removeBrowserstackFromPolyfill(polyfill);
        DomBridger.removeHeadlessFromPolyfill(polyfill);
        // remove variations
        DomBridger.removeVariationsFromPolyfill(polyfill);

        this.dataMap[emulateOsId] = this.dataMap[emulateOsId] || {};
        this.dataMap[emulateOsId][runtimeOsId] = polyfill;
      }
    }
  }

  public save(dataDir: string): void {
    for (const [emulateOsId, dataByRuntimeOsId] of Object.entries(this.dataMap)) {
      const dataOsDir = EmulatorData.getEmulatorDataOsDir(dataDir, emulateOsId);
      if (!Fs.existsSync(dataOsDir)) Fs.mkdirSync(dataOsDir, { recursive: true });

      for (const runtimeOsId of Object.keys(dataByRuntimeOsId)) {
        const dataString = JSON.stringify(dataByRuntimeOsId[runtimeOsId], null, 2);
        const domDiffsPath = Path.join(dataOsDir,  `dom-polyfill-when-runtime-${runtimeOsId}.json`);
        const byteSize = Buffer.byteLength(dataString, 'utf8');

        const { add, remove, modify } = dataByRuntimeOsId[runtimeOsId];
        if (add.length || remove.length || modify.length) {
          log('----------------------------------');
          log(formatBytes(byteSize).padEnd(10), domDiffsPath);

          if (add.length) {
            log('\nMUST ADD:');
            for (const toAdd of add || []) {
              log(`- ${toAdd.path}.${toAdd.propertyName}`);
            }
          }

          if (remove.length) {
            log('\nMUST REMOVE:');
            for (const item of remove || []) {
              log(`- ${item.path}.${item.propertyName}`);
            }
          }

          if (modify.length) {
            log('\nMUST MODIFY:');
            for (const item of modify || []) {
              log(`- ${item.path}.${item.propertyName}`);
            }
          }
        }

        Fs.writeFileSync(domDiffsPath, `${dataString}\n`);
      }
    }
  }

  public static hasAllDomPolyfills(
    browserId: string,
    dataDir: string,
    userAgentIds: string[],
  ): boolean {
    const osIds = getFoundationDomOsIds(browserId);
    for (const userAgentId of userAgentIds) {
      const { operatingSystemId: emulateOsId } =
        BrowserProfiler.extractMetaFromUserAgentId(userAgentId);
      const dataOsDir = EmulatorData.getEmulatorDataOsDir(dataDir, emulateOsId);
      if (!Fs.existsSync(dataOsDir)) return false;
      const files = Fs.readdirSync(dataOsDir).filter(x => x.startsWith('dom-polyfill'));
      for (const runtimeOsId of osIds) {
        if (!files.some(x => x.includes(runtimeOsId))) return false;
      }
    }
    return true;
  }
}

function getFoundationDomOsIds(forBrowserId: string): string[] {
  const osIds = new Set<string>();
  for (const dirName of Fs.readdirSync(browserstackProfilesDir)) {
    const [osId, browserId] = dirName.split('--');
    if (browserId !== forBrowserId) continue;
    osIds.add(osId);
  }
  return [...osIds];
}

function getFoundationDoms(forBrowserId: string): { [operatingSystemId: string]: IDomProfile } {
  const domsByOsId: { [operatingSystemId: string]: IDomProfile } = {};
  const domPathsByOsId: { [operatingSystemId: string]: string } = {};

  for (const dirName of Fs.readdirSync(browserstackProfilesDir)) {
    const [osId, browserId] = dirName.split('--');
    if (browserId !== forBrowserId) continue;

    const startingDomPath = `${browserstackProfilesDir}/${dirName}/browser-dom-environment--https--1.json`;
    const { data: dom } = JSON.parse(Fs.readFileSync(startingDomPath, 'utf8'));
    domsByOsId[osId] = dom;
    domPathsByOsId[osId] = startingDomPath;
  }

  // add linux polyfills (NOTE: don't want these until we do headed)
  for (const dirName of Fs.readdirSync(localProfilesDir)) {
    const [osId, browserId, features] = dirName.split('--');
    if (browserId !== forBrowserId) continue;
    if (osId !== 'linux') continue;
    if (features !== 'headed-devtools') continue;

    const startingDomPath = `${localProfilesDir}/${dirName}/browser-dom-environment--https--1.json`;
    const { data: dom } = JSON.parse(Fs.readFileSync(startingDomPath, 'utf8'));
    domsByOsId[osId] = dom;
    domPathsByOsId[osId] = startingDomPath;
  }
  return domsByOsId;
}

function formatBytes(bytes, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  // eslint-disable-next-line no-restricted-properties
  const finalSize = parseFloat((bytes / k ** i).toFixed(dm));
  return `${finalSize} ${sizes[i]}`;
}
