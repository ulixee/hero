import type IResolvablePromise from './IResolvablePromise';
import { IPipelineStatus } from './Location';

export default interface INavigation {
  id: number;
  frameId: string;
  resourceId: IResolvablePromise<number>;
  browserRequestId: string;
  navigationError?: Error;
  startCommandId: number;
  requestedUrl: string;
  initiatedTime: Date;
  navigationReason: NavigationReason;
  finalUrl?: string;
  stateChanges: Map<NavigationState, Date>;
}

export type NavigationState = Exclude<IPipelineStatus, 'PaintingStable'> | 'Load' | 'ContentPaint';

export type NavigationReason =
  | DevToolsNavigationReason
  | 'goto'
  | 'userGesture'
  | 'inPage'
  | 'newTab';

type DevToolsNavigationReason =
  | 'formSubmissionGet'
  | 'formSubmissionPost'
  | 'httpHeaderRefresh'
  | 'scriptInitiated'
  | 'metaTagRefresh'
  | 'pageBlockInterstitial'
  | 'reload'
  | 'anchorClick';
