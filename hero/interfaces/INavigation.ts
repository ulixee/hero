import type IResolvablePromise from './IResolvablePromise';

export default interface INavigation {
  id: number;
  frameId: number;
  resourceId: IResolvablePromise<number>;
  browserRequestId: string;
  loaderId: string;
  navigationError?: Error;
  startCommandId: number;
  requestedUrl: string;
  initiatedTime: Date;
  navigationReason: NavigationReason;
  finalUrl?: string;
  stateChanges: Map<NavigationState, Date>;
}

export enum LoadStatus {
  NavigationRequested = 'NavigationRequested',
  HttpRequested = 'HttpRequested',
  HttpRedirected = 'HttpRedirected',
  HttpResponded = 'HttpResponded',

  DomContentLoaded = 'DomContentLoaded',
  Load = 'Load',
  ContentPaint = 'ContentPaint',
}

export type NavigationState = keyof typeof LoadStatus;

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
