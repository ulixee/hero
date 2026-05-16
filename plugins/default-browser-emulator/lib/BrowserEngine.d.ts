import IBrowserEngine from '@ulixee/unblocked-specification/agent/browser/IBrowserEngine';
import IBrowserEngineOption from '@ulixee/unblocked-specification/agent/browser/IBrowserEngineOption';
export default class BrowserEngine implements IBrowserEngine {
    name: string;
    fullVersion: string;
    executablePath: string;
    executablePathEnvVar: string;
    userDataDir?: string;
    readonly launchArguments: string[];
    isHeaded?: boolean;
    isInstalled: boolean;
    doesBrowserAnimateScrolling: boolean;
    private engineOption;
    private readonly engineFetcher;
    constructor(browserEngineOption: IBrowserEngineOption);
    verifyLaunchable(): Promise<void>;
    private loadEngineFetcher;
}
