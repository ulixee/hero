import IBrowser from '../interfaces/IBrowser';
import IBrowserVersion from '../interfaces/IBrowserVersion';
import { IDeviceCategory } from '../interfaces/DeviceCategory';
export default class Browser implements IBrowser {
    id: string;
    name: string;
    marketshare: number;
    version: IBrowserVersion;
    deviceCategory: IDeviceCategory;
    releaseDate: string;
    description: string;
    constructor(browser: IBrowser);
    get operatingSystemIds(): string[];
    static load(browser: IBrowser): Browser;
}
