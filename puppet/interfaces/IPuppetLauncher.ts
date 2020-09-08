import ILaunchedProcess from './ILaunchedProcess';
import IPuppetBrowser from './IPuppetBrowser';

export default interface IPuppetLauncher {
  getLaunchArgs(options: { proxyPort?: number; showBrowser?: boolean });
  createPuppet(process: ILaunchedProcess): Promise<IPuppetBrowser>;
}
