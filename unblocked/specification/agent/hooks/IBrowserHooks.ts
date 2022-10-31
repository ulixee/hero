import IDevtoolsSession from '../browser/IDevtoolsSession';
import { IPage } from '../browser/IPage';
import { IWorker } from '../browser/IWorker';
import IBrowser from '../browser/IBrowser';
import IBrowserLaunchArgs from '../browser/IBrowserLaunchArgs';
import IBrowserContext from '../browser/IBrowserContext';

export interface IBrowserContextHooks {
  onNewPage?(page: IPage): Promise<any>;
  onNewWorker?(worker: IWorker): Promise<any>;

  onDevtoolsPanelAttached?(devtoolsSession: IDevtoolsSession): Promise<any>;
  onDevtoolsPanelDetached?(devtoolsSession: IDevtoolsSession): Promise<any>;
}

export default interface IBrowserHooks {
  onNewBrowser?(browser: IBrowser, options: IBrowserLaunchArgs): void;
  onNewBrowserContext?(context: IBrowserContext): Promise<any>;
  onDevtoolsPanelAttached?(devtoolsSession: IDevtoolsSession): Promise<any>;
}
