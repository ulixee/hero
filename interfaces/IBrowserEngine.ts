import IPuppetLaunchArgs from './IPuppetLaunchArgs';

export default interface IBrowserEngine {
  name: string;
  fullVersion: string;
  executablePath: string;
  executablePathEnvVar: string;

  isHeaded?: boolean;
  verifyLaunchable?(): Promise<any>;
  getLaunchArguments?(puppetOptions: IPuppetLaunchArgs, defaultArguments: string[]): string[];
}

export type IBrowserEngineConfig = Pick<
  IBrowserEngine,
  'name' | 'fullVersion' | 'executablePathEnvVar'
>;
