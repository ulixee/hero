import * as Fs from 'fs';
import * as Path from 'path';
import IDomProfile, {
  IProfileDataByProtocol,
} from '@double-agent/collect-browser-dom-environment/interfaces/IProfile';
import IDomPolyfill from '@ulixee/unblocked-specification/plugin/IDomPolyfill';
import BrowserProfiler from '@ulixee/unblocked-browser-profiler';
import DomBridger from '@ulixee/unblocked-browser-profiler-dom-bridger';
import IBaseProfile from '@double-agent/collect/interfaces/IBaseProfile';
import { gunzipSync } from 'zlib';
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

        const polyfill = generatePolyfill(profile.data.https, foundationDom);
        // apply devtools, browserstack, headless indicator removes
        DomBridger.removeDevtoolsFromPolyfill(polyfill);
        DomBridger.removeBrowserstackFromPolyfill(polyfill);
        DomBridger.removeHeadlessFromPolyfill(polyfill);
        // remove variations
        DomBridger.removeVariationsFromPolyfill(polyfill);
        // remove stuff not support by our polyfill plugin
        DomBridger.removeCustomCallbackFromPolyfill(polyfill, filterNotSupportedByPolyfillPlugin);

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
        const domDiffsPath = Path.join(dataOsDir, `dom-polyfill-when-runtime-${runtimeOsId}.json`);
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

  public static clean(dataDir: string, userAgentIds: string[]): void {
    for (const userAgentId of userAgentIds) {
      const { operatingSystemId: emulateOsId } =
        BrowserProfiler.extractMetaFromUserAgentId(userAgentId);
      const dataOsDir = EmulatorData.getEmulatorDataOsDir(dataDir, emulateOsId);
      if (Fs.existsSync(dataOsDir)) Fs.rmSync(dataOsDir, { recursive: true });
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

function filterNotSupportedByPolyfillPlugin(
  path: string,
  propertyName: string,
  value: any,
): boolean {
  // DomExtractor timedout and produced this output
  if (value === 'Promise-like') {
    return true;
  }

  // Function needs multiple arguments
  if (typeof value === 'string' && value.includes('but only 0 present')) {
    return true;
  }

  // Handled by other plugin
  const pathsToIgnore = ['window.navigator.platform'];
  if (pathsToIgnore.includes(path)) {
    return true;
  }

  const languages = ['window.navigator.languages', 'window.navigator.language'];
  if (languages.includes(path)) {
    return true;
  }

  // Currently we don't support creating otherInvocations with new()
  if (propertyName.includes('_$otherInvocation') && propertyName.includes('new()')) {
    return true;
  }

  return false;
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

    const startingDomPath = `${browserstackProfilesDir}/${dirName}/browser-dom-environment--https--1.json.gz`;
    const { data: dom } = JSON.parse(gunzipSync(Fs.readFileSync(startingDomPath)).toString());
    domsByOsId[osId] = dom;
    domPathsByOsId[osId] = startingDomPath;
  }

  for (const dirName of Fs.readdirSync(localProfilesDir)) {
    const [osId, browserId, features] = dirName.split('--');
    if (browserId !== forBrowserId) continue;
    if (osId !== 'linux') continue;
    // add linux polyfills (NOTE: these should switch to headed)
    if (features !== 'headless-devtools') continue;

    const startingDomPath = `${localProfilesDir}/${dirName}/browser-dom-environment--https--1.json.gz`;
    const { data: dom } = JSON.parse(gunzipSync(Fs.readFileSync(startingDomPath)).toString());
    domsByOsId[osId] = dom;
    domPathsByOsId[osId] = startingDomPath;
  }
  return domsByOsId;
}

function formatBytes(bytes, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1e3;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  // eslint-disable-next-line no-restricted-properties
  const finalSize = parseFloat((bytes / k ** i).toFixed(dm));
  return `${finalSize} ${sizes[i]}`;
}
