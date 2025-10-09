import IBrowserEngine from '@ulixee/unblocked-specification/agent/browser/IBrowserEngine';
import ChromeApp from '@ulixee/chrome-app';
export default class ChromeEngine implements IBrowserEngine {
    readonly source: ChromeApp;
    static defaultPackageName: string;
    name: string;
    fullVersion: string;
    executablePath: string;
    executablePathEnvVar: string;
    readonly launchArguments: string[];
    isInstalled: boolean;
    userDataDir?: string;
    doesBrowserAnimateScrolling: boolean;
    isHeaded?: boolean;
    constructor(source: ChromeApp);
    verifyLaunchable(): Promise<any>;
    static fromPackageName(npmPackage: string): ChromeEngine;
    static default(): ChromeEngine;
}
