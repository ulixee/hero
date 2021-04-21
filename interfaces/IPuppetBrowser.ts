import { IBoundLog } from './ILog';
import IBrowserEmulator from './IBrowserEmulator';
import IPuppetContext from './IPuppetContext';
import IProxyConnectionOptions from './IProxyConnectionOptions';

export default interface IPuppetBrowser {
  getFeatures(): Promise<{
    supportsPerBrowserContextProxy: boolean;
    version: { major: string; minor: string };
  }>;
  newContext(
    emulator: IBrowserEmulator,
    logger: IBoundLog,
    proxy?: IProxyConnectionOptions,
  ): Promise<IPuppetContext>;
  close(): Promise<void>;
}
