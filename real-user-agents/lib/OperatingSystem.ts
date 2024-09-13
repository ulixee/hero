import IOperatingSystem from '../interfaces/IOperatingSystem';
import IOperatingSystemVersion from '../interfaces/IOperatingSystemVersion';
import { IDeviceCategory } from '../interfaces/DeviceCategory';

export default class OperatingSystem implements IOperatingSystem {
  id: string;
  name: string;
  marketshare: number;
  version: IOperatingSystemVersion;
  deviceCategory: IDeviceCategory;
  releaseDate: string;
  description: string;

  constructor(id, name, marketshare, version, deviceCategory, releaseDate, description) {
    this.id = id;
    this.name = name;
    this.marketshare = marketshare;
    this.version = version;
    this.deviceCategory = deviceCategory;
    this.releaseDate = releaseDate;
    this.description = description;
  }

  public static load(object: IOperatingSystem): OperatingSystem {
    const { id, name, marketshare, version, deviceCategory, releaseDate, description } = object;
    return new this(id, name, marketshare, version, deviceCategory, releaseDate, description);
  }
}
