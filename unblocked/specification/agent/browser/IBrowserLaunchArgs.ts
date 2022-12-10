export default interface IBrowserLaunchArgs {
  proxyPort?: number;
  showChrome?: boolean;
  showDevtools?: boolean;
  disableGpu?: boolean;
  disableIncognito?: boolean;
  disableMitm?: boolean;
  noChromeSandbox?: boolean;
}
