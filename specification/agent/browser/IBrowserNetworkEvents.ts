import IHttpResourceLoadDetails from '../net/IHttpResourceLoadDetails';
import RequestWillBeSentEvent = Protocol.Network.RequestWillBeSentEvent;
import Protocol from 'devtools-protocol';

export declare type IBrowserResourceRequest = Omit<
  IHttpResourceLoadDetails,
  'requestTrailers' | 'responseTrailers' | 'requestOriginalHeaders' | 'responseOriginalHeaders'
> & {
  frameId?: string;
  redirectedFromUrl?: string;
};

export interface IBrowserNetworkEvents {
  'navigation-response': {
    browserRequestId: string;
    frameId: string;
    status: number;
    location?: string;
    url?: string;
    loaderId: string;
    timestamp: number;
  };
  'websocket-frame': {
    browserRequestId: string;
    message: string | Buffer;
    isFromServer: boolean;
    timestamp: number;
  };
  'websocket-handshake': {
    browserRequestId: string;
    headers: { [key: string]: string };
  };
  'resource-will-be-requested': {
    resource: IBrowserResourceRequest;
    redirectedFromUrl: string;
    isDocumentNavigation: boolean;
    frameId: string;
    loaderId?: string;
  };
  'resource-was-requested': {
    resource: IBrowserResourceRequest;
    redirectedFromUrl: string;
    isDocumentNavigation: boolean;
    frameId: string;
    loaderId?: string;
  };
  'resource-loaded': {
    resource: IBrowserResourceRequest;
    frameId?: string;
    loaderId?: string;
    body(): Promise<Buffer | null>;
  };
  'resource-failed': {
    resource: IBrowserResourceRequest;
  };
  // Special internal network request, used to communicate internal data
  'internal-request': {
    request: RequestWillBeSentEvent;
  };
}
