import { readFileSync } from 'fs';
import IUserAgent from '../interfaces/IUserAgent';
import { getDataFilePath } from './paths';
import Browsers from './Browsers';
import OperatingSystems from './OperatingSystems';
import IOperatingSystemVersion from '../interfaces/IOperatingSystemVersion';

export default class UserAgent implements IUserAgent {
  public static filePath = getDataFilePath('userAgentsById.json');
  public static byId: IUserAgentsById;

  public id: string;
  public pattern: string;
  public operatingSystemId: string;
  public operatingSystemVersion: IOperatingSystemVersion;
  public browserId: string;
  public browserBaseVersion: [major: number, minor: number, patch: number, patch?: number];
  public marketshare: number;
  public stablePatchVersions: number[];
  public allPatchVersions: number[];
  public uaClientHintsPlatformVersions: string[];

  constructor(entry: IUserAgent) {
    const {
      id,
      pattern,
      operatingSystemId,
      browserId,
      marketshare,
      uaClientHintsPlatformVersions,
      allPatchVersions,
      stablePatchVersions,
      browserBaseVersion,
      operatingSystemVersion,
    } = entry;
    this.id = id;
    this.pattern = pattern;
    this.operatingSystemId = operatingSystemId;
    this.browserId = browserId;
    this.marketshare = marketshare;
    this.browserBaseVersion = browserBaseVersion;
    this.stablePatchVersions = stablePatchVersions;
    this.allPatchVersions = allPatchVersions;
    this.uaClientHintsPlatformVersions = uaClientHintsPlatformVersions;
    this.operatingSystemVersion = operatingSystemVersion;
  }

  public get browserName(): string {
    return Browsers.byId(this.browserId).name;
  }

  public get operatingSystemName(): string {
    return OperatingSystems.byId(this.operatingSystemId).name;
  }

  public static parse(
    object: { pattern: string },
    patchVersion: number | string,
    osVersion: string,
  ): string {
    let pattern = object.pattern.replace('$patch$', String(patchVersion));
    if (osVersion) {
      pattern = pattern.replace('$osVersion$', osVersion.replace(/\./g, '_'));
    }
    return pattern;
  }

  public static load(object: IUserAgent): UserAgent {
    return new this(object);
  }

  public static all(): IUserAgentsById {
    if (!this.byId) {
      this.byId = JSON.parse(readFileSync(this.filePath, 'utf8'));
      for (const [id, entry] of Object.entries(this.byId)) {
        this.byId[id] = UserAgent.load(entry);
      }
    }
    return this.byId;
  }
}

interface IUserAgentsById {
  [id: string]: UserAgent;
}
