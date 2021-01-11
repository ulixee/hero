import ILaunchedProcess from './ILaunchedProcess';
import IPuppetBrowser from './IPuppetBrowser';

export default interface IPuppetLauncher {
  getLaunchArgs(options: { proxyPort?: number; showBrowser?: boolean }): string[];
  createPuppet(process: ILaunchedProcess, revision: string): Promise<IPuppetBrowser>;
  translateLaunchError(error: Error): Error;
}
