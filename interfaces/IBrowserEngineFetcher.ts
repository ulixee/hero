export default interface IBrowserEngineFetcher {
  fullVersion: string;
  executablePath: string;
  executablePathEnvVar: string;
  isInstalled: boolean;
  launchArgs: string[];
  browsersDir: string;
  validateHostRequirements(): Promise<void>;
  install(): Promise<void>;
}
