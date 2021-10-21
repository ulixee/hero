import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import IPuppetContext from './IPuppetContext';
import IProxyConnectionOptions from './IProxyConnectionOptions';
import ICorePlugins from './ICorePlugins';
import IDevtoolsSession from './IDevtoolsSession';

export default interface IPuppetBrowser {
  id: string;
  name: string;
  fullVersion: string;
  majorVersion: number;
  onDevtoolsPanelOpened?: (devtoolsSession: IDevtoolsSession) => Promise<any>;
  newContext(
    plugins: ICorePlugins,
    logger: IBoundLog,
    proxy?: IProxyConnectionOptions,
    isIncognito?: boolean,
  ): Promise<IPuppetContext>;
  close(): Promise<void>;
}
