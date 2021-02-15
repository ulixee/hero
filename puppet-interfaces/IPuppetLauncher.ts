import IBrowserEngine from '@secret-agent/core-interfaces/IBrowserEngine';
import ILaunchedProcess from './ILaunchedProcess';
import IPuppetBrowser from './IPuppetBrowser';

export default interface IPuppetLauncher {
  getLaunchArgs(options: { proxyPort?: number; showBrowser?: boolean }): string[];
  createPuppet(process: ILaunchedProcess, engine: IBrowserEngine): Promise<IPuppetBrowser>;
  translateLaunchError(error: Error): Error;
}
