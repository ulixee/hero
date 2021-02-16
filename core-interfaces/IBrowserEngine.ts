export default interface IBrowserEngine {
  browser: string;
  version: string;
  executablePath: string;
  executablePathEnvVar: string;
  extraLaunchArgs?: string[];
}

export type IBrowserEngineConfig = Pick<
  IBrowserEngine,
  'browser' | 'version' | 'executablePathEnvVar'
>;
