import { IPipelineStatus } from '@secret-agent/core-interfaces/Location';
import { IResolvablePromise } from '@secret-agent/commons/utils';

export default interface IPage {
  id: number;
  frameId: string;
  resourceId: IResolvablePromise<number>;
  startCommandId: number;
  requestedUrl: string;
  initiatedTime: string;
  navigationReason: NavigationReason;
  finalUrl?: string;
  stateChanges: Map<IPipelineStatus, Date>;
}

export type NavigationReason = DevToolsNavigationReason | 'goto' | 'userGesture' | 'inPage';

type DevToolsNavigationReason =
  | 'formSubmissionGet'
  | 'formSubmissionPost'
  | 'httpHeaderRefresh'
  | 'scriptInitiated'
  | 'metaTagRefresh'
  | 'pageBlockInterstitial'
  | 'reload'
  | 'anchorClick';
