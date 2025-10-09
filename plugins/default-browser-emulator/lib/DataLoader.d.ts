import IUserAgentOption from '@ulixee/unblocked-specification/plugin/IUserAgentOption';
import { IDataBrowserEngineOptions, IDataCore } from '../interfaces/IBrowserData';
import BrowserData from './BrowserData';
export default class DataLoader implements IDataCore {
    readonly baseDir: string;
    readonly dataDir: string;
    private readonly browserOsEmulatorsByVersion;
    private readonly osDataDirs;
    constructor();
    isSupportedEmulatorOs(osDir: string): boolean;
    isInstalledBrowser(browserId: string): boolean;
    isInstalledBrowserAndOs(browserId: string, osId: string): boolean;
    get pkg(): any;
    get browserEngineOptions(): IDataBrowserEngineOptions;
    as(userAgentOption: IUserAgentOption): BrowserData;
    getBrowserOperatingSystemVersions(browserId: string, osName: string): string[];
}
export declare function loadData(path: string): any;
