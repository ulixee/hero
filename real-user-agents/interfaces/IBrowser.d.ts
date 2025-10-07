import IBrowserVersion from './IBrowserVersion';
import { IDeviceCategory } from './DeviceCategory';
export default interface IBrowser {
    id: string;
    name: string;
    marketshare: number;
    version: IBrowserVersion;
    deviceCategory: IDeviceCategory;
    releaseDate: string;
    description: string;
}
