import { IBoundLog } from './ILog';
import IPuppetContext from './IPuppetContext';
import IProxyConnectionOptions from './IProxyConnectionOptions';
import ICorePlugins from './ICorePlugins';

export default interface IPuppetBrowser {
  getFeatures(): Promise<{
    supportsPerBrowserContextProxy: boolean;
    version: { major: string; minor: string };
  }>;
  newContext(
    plugins: ICorePlugins,
    logger: IBoundLog,
    proxy?: IProxyConnectionOptions,
  ): Promise<IPuppetContext>;
  close(): Promise<void>;
}
