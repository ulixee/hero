import { IBoundLog } from './ILog';
import IPuppetContext from './IPuppetContext';
import IProxyConnectionOptions from './IProxyConnectionOptions';
import IPlugins from './IPlugins';

export default interface IPuppetBrowser {
  getFeatures(): Promise<{
    supportsPerBrowserContextProxy: boolean;
    version: { major: string; minor: string };
  }>;
  newContext(
    plugins: IPlugins,
    logger: IBoundLog,
    proxy?: IProxyConnectionOptions,
  ): Promise<IPuppetContext>;
  close(): Promise<void>;
}
