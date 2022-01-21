import IHttpResourceLoadDetails from './IHttpResourceLoadDetails';

export declare type IPuppetResourceRequest = Omit<
  IHttpResourceLoadDetails,
  'requestTrailers' | 'responseTrailers' | 'requestOriginalHeaders' | 'responseOriginalHeaders'
> & {
  frameId?: string;
  redirectedFromUrl?: string;
};

export interface IPuppetNetworkEvents {
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
    resource: IPuppetResourceRequest;
    redirectedFromUrl: string;
    isDocumentNavigation: boolean;
    frameId: string;
    loaderId?: string;
  };
  'resource-was-requested': {
    resource: IPuppetResourceRequest;
    redirectedFromUrl: string;
    isDocumentNavigation: boolean;
    frameId: string;
    loaderId?: string;
  };
  'resource-loaded': {
    resource: IPuppetResourceRequest;
    frameId?: string;
    loaderId?: string;
    body(): Promise<Buffer | null>;
  };
  'resource-failed': {
    resource: IPuppetResourceRequest;
  };
}
