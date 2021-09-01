import type IResolvablePromise from '@ulixee/commons/interfaces/IResolvablePromise';
import { ILoadStatus } from './Location';

export default interface INavigation {
  id: number;
  frameId: number;
  resourceId: IResolvablePromise<number>;
  browserRequestId: string;
  loaderId: string;
  navigationError?: Error;
  startCommandId: number;
  requestedUrl: string;
  initiatedTime: number;
  navigationReason: NavigationReason;
  finalUrl?: string;
  statusChanges: Map<NavigationStatus, number>;
}

export const ContentPaint = 'ContentPaint';
export type NavigationStatus = ILoadStatus | 'ContentPaint';

export type NavigationReason =
  | DevToolsNavigationReason
  | 'goto'
  | 'goBack'
  | 'goForward'
  | 'userGesture'
  | 'inPage'
  | 'newFrame';

type DevToolsNavigationReason =
  | 'formSubmissionGet'
  | 'formSubmissionPost'
  | 'httpHeaderRefresh'
  | 'scriptInitiated'
  | 'metaTagRefresh'
  | 'pageBlockInterstitial'
  | 'reload'
  | 'anchorClick';
