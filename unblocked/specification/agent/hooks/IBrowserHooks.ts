import Protocol from 'devtools-protocol';
import IDevtoolsSession from '../browser/IDevtoolsSession';
import { IPage } from '../browser/IPage';
import { IWorker } from '../browser/IWorker';
import IBrowser from '../browser/IBrowser';
import IBrowserUserConfig from '../browser/IBrowserUserConfig';
import IBrowserContext from '../browser/IBrowserContext';
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
  onNewBrowser?(browser: IBrowser, userConfig: IBrowserUserConfig): void;
  onNewBrowserContext?(context: IBrowserContext): Promise<any>;
  onDevtoolsPanelAttached?(devtoolsSession: IDevtoolsSession, targetInfo?: TargetInfo): Promise<any>;
}
