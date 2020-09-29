import { IResolvablePromise } from '@secret-agent/commons/utils';
import { IPipelineStatus } from './Location';

export default interface INavigation {
  id: number;
  frameId: string;
  resourceId: IResolvablePromise<number>;
  startCommandId: number;
  requestedUrl: string;
  initiatedTime: Date;
  navigationReason: NavigationReason;
  finalUrl?: string;
  stateChanges: Map<IPipelineStatus, Date>;
}

export type NavigationReason = DevToolsNavigationReason | 'goto' | 'userGesture' | 'inPage' | 'newTab';

type DevToolsNavigationReason =
  | 'formSubmissionGet'
  | 'formSubmissionPost'
  | 'httpHeaderRefresh'
  | 'scriptInitiated'
  | 'metaTagRefresh'
  | 'pageBlockInterstitial'
  | 'reload'
  | 'anchorClick';
