import IBrowserEngineOption from '@ulixee/unblocked-specification/agent/browser/IBrowserEngineOption';
import { IVersion } from '@ulixee/unblocked-specification/plugin/IUserAgentOption';
import DataLoader from './DataLoader';
type IBrowserEngineOptionAndVersion = IBrowserEngineOption & {
    version: IVersion;
};
export default class BrowserEngineOptions {
    private dataLoader;
    readonly default: IBrowserEngineOptionAndVersion;
    readonly installedOptions: IBrowserEngineOptionAndVersion[];
    private browserIdsNeedingDataFiles;
    constructor(dataLoader: DataLoader, defaultBrowserId: string);
    private getInstalled;
    private checkForInstalled;
    static latestFullVersion(option: IBrowserEngineOption): string;
}
export {};
