import IOperatingSystemVersion from './IOperatingSystemVersion';
import { IDeviceCategory } from './DeviceCategory';
export default interface IOperatingSystem {
    id: string;
    name: string;
    marketshare: number;
    version: IOperatingSystemVersion;
    deviceCategory: IDeviceCategory;
    releaseDate: string;
    description: string;
}
