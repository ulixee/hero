export default interface IPuppetLaunchArgs {
  proxyPort?: number;
  showChrome?: boolean;
  disableDevtools?: boolean;
  disableGpu?: boolean;
  noChromeSandbox?: boolean;
  enableMitm?: boolean;
}
