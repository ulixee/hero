export default interface IPuppetLaunchArgs {
  proxyPort?: number;
  showBrowser?: boolean;
  disableDevtools?: boolean;
  disableGpu?: boolean;
  noChromeSandbox?: boolean;
  enableMitm?: boolean;
}
