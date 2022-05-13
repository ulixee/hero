import * as Fs from 'fs';
import IUserAgentOption from '@unblocked-web/specifications/plugin/IUserAgentOption';
import {
  IDataBrowserEngineOptions,
  IDataCore,
  IDataUserAgentOptions,
} from '../interfaces/IBrowserData';
import BrowserData from './BrowserData';

export default class DataLoader implements IDataCore {
  public readonly baseDir: string;
  public readonly dataDir: string;

  private readonly browserOsEmulatorsByVersion: {
    [versionString: string]: { [os: string]: string[] };
  } = {};

  private readonly osDataDirs = new Set<string>();

  constructor(baseDir: string) {
    this.baseDir = baseDir;
    this.dataDir = `${baseDir}/data`;
    const browsers = Fs.readdirSync(this.dataDir);
    for (const browser of browsers) {
      if (browser.startsWith('as-') && Fs.statSync(`${this.dataDir}/${browser}`).isDirectory()) {
        this.browserOsEmulatorsByVersion[browser] = {};
        for (const osDir of Fs.readdirSync(`${this.dataDir}/${browser}`)) {
          if (
            osDir.startsWith('as-') &&
            Fs.statSync(`${this.dataDir}/${browser}/${osDir}`).isDirectory()
          ) {
            const isMac = osDir.startsWith('as-mac');
            const version = osDir.replace('as-mac-os-', '').replace('as-windows-', '');
            const name = isMac ? 'mac-os' : 'windows';
            this.browserOsEmulatorsByVersion[browser][name] ??= [];
            this.browserOsEmulatorsByVersion[browser][name].push(version);
            this.osDataDirs.add(`${this.dataDir}/${browser}/${osDir}`);
          }
        }
      }
    }
  }

  public isSupportedEmulatorOs(osDir: string): boolean {
    return this.osDataDirs.has(osDir);
  }

  public isInstalledBrowser(browserId: string): boolean {
    return !!(
      this.browserOsEmulatorsByVersion[browserId] ||
      this.browserOsEmulatorsByVersion[`as-${browserId}`]
    );
  }

  public isInstalledBrowserAndOs(browserId: string, osId: string): boolean {
    const path = `${this.dataDir}/as-${browserId}/as-${osId}`;
    return this.osDataDirs.has(path);
  }

  public get pkg(): any {
    return loadData(`${this.baseDir}/package.json`);
  }

  public get browserEngineOptions(): IDataBrowserEngineOptions {
    return loadData(`${this.dataDir}/browserEngineOptions.json`);
  }

  public get userAgentOptions(): IDataUserAgentOptions {
    return loadData(`${this.dataDir}/userAgentOptions.json`);
  }

  public as(userAgentOption: IUserAgentOption): BrowserData {
    return new BrowserData(this, userAgentOption);
  }

  public getBrowserOperatingSystemVersions(browserId: string, osName: string): string[] {
    if (!this.browserOsEmulatorsByVersion[`as-${browserId}`]) return [];
    return this.browserOsEmulatorsByVersion[`as-${browserId}`][osName];
  }
}

const cacheMap: { [path: string]: any } = {};

export function loadData(path: string): any {
  cacheMap[path] = cacheMap[path] || JSON.parse(Fs.readFileSync(path, 'utf8'));
  return cacheMap[path];
}
