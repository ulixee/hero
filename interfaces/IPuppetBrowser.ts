import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import IPuppetContext from './IPuppetContext';
import IProxyConnectionOptions from './IProxyConnectionOptions';
import ICorePlugins from './ICorePlugins';
import IDevtoolsSession from './IDevtoolsSession';

export default interface IPuppetBrowser {
  onDevtoolsAttached?: (devtoolsSession: IDevtoolsSession) => Promise<any>;
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
