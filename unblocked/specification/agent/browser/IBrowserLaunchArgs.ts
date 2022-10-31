export default interface IBrowserLaunchArgs {
  proxyPort?: number;
  showChrome?: boolean;
  disableDevtools?: boolean;
  disableGpu?: boolean;
  disableIncognito?: boolean;
  disableMitm?: boolean;
  noChromeSandbox?: boolean;
}
