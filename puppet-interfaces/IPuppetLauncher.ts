import IBrowserEngine from '@secret-agent/core-interfaces/IBrowserEngine';
import ILaunchedProcess from './ILaunchedProcess';
import IPuppetBrowser from './IPuppetBrowser';
import { IPuppetLaunchError } from './IPuppetLaunchError';

export default interface IPuppetLauncher {
  getLaunchArgs(options: { proxyPort?: number; showBrowser?: boolean }): string[];
  createPuppet(process: ILaunchedProcess, engine: IBrowserEngine): Promise<IPuppetBrowser>;
  translateLaunchError(error: Error): IPuppetLaunchError;
}
