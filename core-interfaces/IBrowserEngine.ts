export default interface IBrowserEngine {
  name: string;
  fullVersion: string;
  executablePath: string;
  executablePathEnvVar: string;
  extraLaunchArgs?: string[];
  isHeaded?: boolean;
}

export type IBrowserEngineConfig = Pick<
  IBrowserEngine,
  'name' | 'fullVersion' | 'executablePathEnvVar'
>;
