export interface ILaunchOptions {
  showBrowser?: boolean;
  executablePath: string;
  proxyPort: number;
  dumpio?: boolean;
  env?: Record<string, string | undefined>;
}
