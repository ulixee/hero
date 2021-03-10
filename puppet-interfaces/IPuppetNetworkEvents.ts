import IHttpResourceLoadDetails from '@secret-agent/core-interfaces/IHttpResourceLoadDetails';

export interface IPuppetNetworkEvents {
  'navigation-response': {
    browserRequestId: string;
    frameId: string;
    status: number;
    location?: string;
    url?: string;
  };
  'websocket-frame': {
    browserRequestId: string;
    message: string | Buffer;
    isFromServer: boolean;
  };
  'websocket-handshake': {
    browserRequestId: string;
    headers: { [key: string]: string };
  };
  'resource-will-be-requested': {
    resource: IHttpResourceLoadDetails;
    redirectedFromUrl: string;
    isDocumentNavigation: boolean;
    frameId: string;
  };
  'resource-was-requested': {
    resource: IHttpResourceLoadDetails;
    redirectedFromUrl: string;
    isDocumentNavigation: boolean;
    frameId: string;
  };
  'resource-loaded': {
    resource: IHttpResourceLoadDetails;
    frameId?: string;
  };
  'resource-failed': {
    resource: IHttpResourceLoadDetails;
  };
}
