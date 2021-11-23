import * as Fs from 'fs';
import IUserAgentOption from '@ulixee/hero-interfaces/IUserAgentOption';
import IBrowserData, {
  IDataBrowserConfig,
  IDataClienthello,
  IDataCodecs,
  IDataDomPolyfill,
  IDataHeaders,
  IDataHttp2Settings,
  IDataWindowChrome,
  IDataWindowFraming,
  IDataWindowNavigator,
} from '../interfaces/IBrowserData';
import DataLoader, { loadData } from './DataLoader';
import getLocalOperatingSystemMeta from './utils/getLocalOperatingSystemMeta';
import { convertMacOsVersionString, findClosestVersionMatch } from './VersionUtils';

const localOsMeta = getLocalOperatingSystemMeta();

export default class BrowserData implements IBrowserData {
  private readonly dataLoader: DataLoader;
  private readonly baseDataDir: string;
  private readonly osDataDir: string;
  private domPolyfillFilename: string;

  constructor(dataLoader: DataLoader, userAgentOption: IUserAgentOption) {
    const browserId = createBrowserId(userAgentOption);
    const os = getOperatingSystemParts(userAgentOption);
    this.dataLoader = dataLoader;
    this.baseDataDir = `${dataLoader.dataDir}/as-${browserId}`;
    this.osDataDir = `${this.baseDataDir}/as-${os.name}-${os.version}`;
    if (!this.dataLoader.isSupportedEmulator(this.osDataDir)) {
      const otherVersions = this.dataLoader.getBrowserOperatingSystemVersions(browserId, os.name);
      if (!otherVersions.length) {
        throw new Error(`${browserId} has no emulation data for ${os.name}`);
      }
      const closestVersionMatch = findClosestVersionMatch(os.version, otherVersions);
      this.osDataDir = `${this.baseDataDir}/as-${os.name}-${closestVersionMatch}`;
    }
  }

  public get pkg(): any {
    return this.dataLoader.pkg;
  }

  public get headers(): IDataHeaders {
    return loadData(`${this.baseDataDir}/headers.json`);
  }

  public get windowBaseFraming(): IDataWindowFraming {
    return loadData(`${this.baseDataDir}/window-base-framing.json`);
  }

  public get browserConfig(): IDataBrowserConfig {
    return loadData(`${this.baseDataDir}/config.json`);
  }

  public get clienthello(): IDataClienthello {
    return loadData(`${this.osDataDir}/clienthello.json`);
  }

  public get codecs(): IDataCodecs {
    return loadData(`${this.osDataDir}/codecs.json`);
  }

  public get http2Settings(): IDataHttp2Settings {
    return loadData(`${this.osDataDir}/http2-session.json`);
  }

  public get windowChrome(): IDataWindowChrome {
    try {
      return loadData(`${this.osDataDir}/window-chrome.json`);
    } catch (e) {
      return undefined;
    }
  }

  public get windowFraming(): IDataWindowFraming {
    return loadData(`${this.osDataDir}/window-framing.json`);
  }

  public get windowNavigator(): IDataWindowNavigator {
    return loadData(`${this.osDataDir}/window-navigator.json`);
  }

  public get domPolyfill(): IDataDomPolyfill {
    try {
      this.domPolyfillFilename ??= extractPolyfillFilename(this.osDataDir);
      return loadData(`${this.osDataDir}/${this.domPolyfillFilename}`);
    } catch (e) {
      return undefined;
    }
  }
}

const polyfillFilesByDatadir: {
  [dataDir: string]: { [osName: string]: { [osVersion: string]: string } };
} = {};

function extractPolyfillFilename(dataDir: string) {
  let filenameMap = polyfillFilesByDatadir[dataDir];
  if (!filenameMap) {
    filenameMap = {};
    polyfillFilesByDatadir[dataDir] = filenameMap;
    for (const filename of Fs.readdirSync(dataDir)) {
      const matches = filename.match(/^dom-polyfill-when-runtime-([a-z-]+)(-([0-9-]+))?.json$/);
      if (!matches) continue;

      const [osName, _, osVersion] = matches.slice(1); // eslint-disable-line @typescript-eslint/naming-convention,@typescript-eslint/no-unused-vars
      filenameMap[osName] = filenameMap[osName] || {};
      filenameMap[osName][osVersion || 'ALL'] = filename;
    }
  }

  if (!filenameMap[localOsMeta.name]) {
    throw new Error(`Your OS (${localOsMeta.name}) is not supported by this emulator.`);
  }

  const versionMatch = findClosestVersionMatch(
    localOsMeta.version,
    Object.keys(filenameMap[localOsMeta.name]),
  );

  if (!versionMatch) {
    throw new Error(
      `Emulator could not find a version match for ${localOsMeta.name} ${localOsMeta.version}`,
    );
  }

  return filenameMap[localOsMeta.name][versionMatch];
}

function createBrowserId(userAgentOption: IUserAgentOption) {
  const { browserName, browserVersion } = userAgentOption;
  return [browserName, browserVersion.major, browserVersion.minor].filter(x => x).join('-');
}

function getOperatingSystemParts(userAgentOption: IUserAgentOption) {
  const { operatingSystemName: name, operatingSystemVersion: version } = userAgentOption;
  let { major, minor } = version;

  if (name.startsWith('mac')) {
    [major, minor] = convertMacOsVersionString([major, minor].filter(x => x).join('.')).split('.');
  } else if (name.startsWith('win') && version.minor === '0') {
    minor = null;
  }
  const finalVersion = [major, minor].filter(x => x).join('-');
  return { name, version: finalVersion };
}
