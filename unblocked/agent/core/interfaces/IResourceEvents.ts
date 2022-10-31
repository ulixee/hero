import type IResourceMeta from '@unblocked-web/specifications/agent/net/IResourceMeta';
import { IBrowserResourceRequest } from '@unblocked-web/specifications/agent/browser/IBrowserNetworkEvents';
import { ICookie } from '@unblocked-web/specifications/agent/net/ICookie';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import IResourceType from '@unblocked-web/specifications/agent/net/IResourceType';
import IResourceProcessingDetails from './IResourceProcessingDetails';

export interface IResourceEvents {
  change: {
    tabId: number;
    resource: IResourceMeta;
    requestProcessingDetails: IResourceProcessingDetails;
    type:
      | 'mitm-request'
      | 'mitm-response'
      | 'mitm-error'
      | 'browser-requested'
      | 'browser-error'
      | 'browser-loaded';
    body?: Buffer;
    postData?: Buffer;
    error?: Error;
  };
  merge: {
    resourceId: number;
    existingResource: IResourceMeta;
    newResourceDetails: IResourceMeta;
    requestProcessingDetails: IResourceProcessingDetails;
    error?: Error;
  };
  'browser-loaded': { resourceId: number; browserLoadedTime: number };
  'browser-will-request': {
    mitmMatch: IMitmRequestPendingBrowserRequest;
    resource: IBrowserResourceRequest;
  };
  'browser-requested': { resourceId: number; browserRequestId: string; tabId: number };
  'cookie-change': {
    tabId: number;
    frameId: number;
    action: string;
    url: URL;
    timestamp: number;
    cookie: ICookie;
  };
}

export interface IMitmRequestPendingBrowserRequest {
  url: string;
  method: string;
  origin: string;
  secFetchSite: string;
  secFetchDest: string;
  referer: string;
  requestTime: number;
  browserRequestedPromise: Resolvable<void>;
  tabId?: number;
  frameId?: number;
  mitmResourceId?: number;
  browserLoadedTime?: number;
  browserRequestId?: string;
  resourceType?: IResourceType;
  documentUrl?: string;
  hasUserGesture?: boolean;
  isHttp2Push?: boolean;
}
