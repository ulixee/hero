export default interface IBrowserEngine {
    name: string;
    fullVersion: string;
    executablePath: string;
    executablePathEnvVar: string;
    launchArguments: string[];
    isInstalled: boolean;
    userDataDir?: string;
    doesBrowserAnimateScrolling?: boolean;
    isHeaded?: boolean;
    isHeadlessNew?: boolean;
    useRemoteDebuggingPort?: boolean;
    verifyLaunchable?(): Promise<any>;
}
