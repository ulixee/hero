export default interface IBrowserEngine {
  browser: string;
  version: string;
  executablePath: string;
  extraLaunchArgs?: string[];
}
