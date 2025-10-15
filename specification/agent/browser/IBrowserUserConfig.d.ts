export default interface IBrowserUserConfig {
    proxyPort?: number;
    showChrome?: boolean;
    showDevtools?: boolean;
    disableGpu?: boolean;
    disableIncognito?: boolean;
    disableMitm?: boolean;
    noChromeSandbox?: boolean;
    useRemoteDebuggingPort?: boolean;
}
