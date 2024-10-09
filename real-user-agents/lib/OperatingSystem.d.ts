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
    constructor(id: any, name: any, marketshare: any, version: any, deviceCategory: any, releaseDate: any, description: any);
    static load(object: IOperatingSystem): OperatingSystem;
}
