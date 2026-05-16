import IUserAgentOption from '@ulixee/unblocked-specification/plugin/IUserAgentOption';
import UserAgent from '@ulixee/real-user-agents/lib/UserAgent';
import DataLoader from './DataLoader';
import UserAgentSelector from './UserAgentSelector';
import BrowserEngineOptions from './BrowserEngineOptions';
export default class UserAgentOptions {
    protected dataLoader: DataLoader;
    protected browserEngineOptions: BrowserEngineOptions;
    private static parsedCached;
    private installedUserAgentOptions;
    private readonly defaultBrowserUserAgentOptions;
    get installedOptions(): UserAgent[];
    constructor(dataLoader: DataLoader, browserEngineOptions: BrowserEngineOptions);
    getDefaultAgentOption(): IUserAgentOption;
    hasDataSupport(userAgentOption: IUserAgentOption): boolean;
    findClosestInstalledToUserAgentString(userAgentString: string): IUserAgentOption;
    findClosestInstalled(userAgent: IUserAgentOption): IUserAgentOption;
    findWithSelector(selectors: UserAgentSelector): IUserAgentOption;
    private static parse;
    private static random;
    private static convertToUserAgentOption;
    private static canTrustOsVersionForAgentString;
    private static replaceOperatingSystem;
    private static chooseOsPatchValue;
}
