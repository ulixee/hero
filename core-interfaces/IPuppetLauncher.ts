import IBrowserEngine from './IBrowserEngine';
import ILaunchedProcess from './ILaunchedProcess';
import IPuppetBrowser from './IPuppetBrowser';
import { IPuppetLaunchError } from './IPuppetLaunchError';
import IPuppetLaunchArgs from './IPuppetLaunchArgs';

export default interface IPuppetLauncher {
  getLaunchArgs(options: IPuppetLaunchArgs, engine: IBrowserEngine): string[];
  createPuppet(process: ILaunchedProcess, engine: IBrowserEngine): Promise<IPuppetBrowser>;
  translateLaunchError(error: Error): IPuppetLaunchError;
}
