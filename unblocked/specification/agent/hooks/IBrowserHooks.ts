import IDevtoolsSession from '../browser/IDevtoolsSession';
import { IPage } from '../browser/IPage';
import { IWorker } from '../browser/IWorker';
import IBrowser from '../browser/IBrowser';
import IBrowserLaunchArgs from '../browser/IBrowserLaunchArgs';
import IBrowserContext from '../browser/IBrowserContext';
import Protocol from 'devtools-protocol';
import TargetInfo = Protocol.Target.TargetInfo;
import { IFrame } from '../browser/IFrame';

export interface IBrowserContextHooks {
  onNewPage?(page: IPage): Promise<any>;
  onNewFrameProcess?(frame: IFrame): Promise<any>;
  onNewWorker?(worker: IWorker): Promise<any>;

  onDevtoolsPanelAttached?(devtoolsSession: IDevtoolsSession, targetInfo?: TargetInfo): Promise<any>;
  onDevtoolsPanelDetached?(devtoolsSession: IDevtoolsSession): Promise<any>;
}

export default interface IBrowserHooks {
  onNewBrowser?(browser: IBrowser, options: IBrowserLaunchArgs): void;
  onNewBrowserContext?(context: IBrowserContext): Promise<any>;
  onDevtoolsPanelAttached?(devtoolsSession: IDevtoolsSession, targetInfo?: TargetInfo): Promise<any>;
}
