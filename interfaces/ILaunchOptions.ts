export default interface ILaunchOptions {
  showChrome?: boolean;
  executablePath: string;
  proxyPort: number;
  dumpio?: boolean;
  env?: Record<string, string | undefined>;
}
