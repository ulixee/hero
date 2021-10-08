import IPuppetLaunchArgs from './IPuppetLaunchArgs';

export default interface IBrowserEngine {
  name: string;
  fullVersion: string;
  executablePath: string;
  executablePathEnvVar: string;
  launchArguments: string[];
  isInstalled: boolean;
  userDataDir?: string;

  isHeaded?: boolean;
  verifyLaunchable?(): Promise<any>;
  beforeLaunch?(puppetOptions: IPuppetLaunchArgs): void;
}
