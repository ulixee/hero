import IBrowser from '../interfaces/IBrowser';
import IBrowserVersion from '../interfaces/IBrowserVersion';
import { IDeviceCategory } from '../interfaces/DeviceCategory';
import UserAgents from '../index';

export default class Browser implements IBrowser {
  public id: string;
  public name: string;
  public marketshare: number;
  public version: IBrowserVersion;
  public deviceCategory: IDeviceCategory;
  public releaseDate: string;
  public description: string;

  constructor(browser: IBrowser) {
    const { id, name, marketshare, version, deviceCategory, releaseDate, description } = browser;
    this.id = id;
    this.name = name;
    this.marketshare = marketshare;
    this.version = version;
    this.deviceCategory = deviceCategory;
    this.releaseDate = releaseDate;
    this.description = description;
  }

  public get operatingSystemIds(): string[] {
    return UserAgents.where({ browserId: this.id }).map(x => x.operatingSystemId);
  }

  public static load(browser: IBrowser): Browser {
    return new this(browser);
  }
}
