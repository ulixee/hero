import * as Fs from 'fs';
import IUserAgentOption from "@secret-agent/interfaces/IUserAgentOption";
import {
  IDataBrowserEngineOptions,
  IDataCore,
  IDataUserAgentOptions,
} from "../interfaces/IBrowserData";
import BrowserData from './BrowserData';

export default class DataLoader implements IDataCore {
  public readonly baseDir: string;
  public readonly dataDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
    this.dataDir = `${baseDir}/data`;
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

  public as(userAgentOption: IUserAgentOption) {
    return new BrowserData(this, userAgentOption);
  }
}

const cacheMap: { [path: string]: any } = {};

export function loadData(path: string) {
  cacheMap[path] = cacheMap[path] || JSON.parse(Fs.readFileSync(path, 'utf8'));
  return cacheMap[path];
}
