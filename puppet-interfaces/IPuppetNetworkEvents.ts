import ResourceType from '@secret-agent/core-interfaces/ResourceType';

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
    browserRequestId: string;
    redirectedFromUrl: string;
    resourceType: ResourceType;
    url: string;
    method: string;
    hasUserGesture: boolean;
    isDocumentNavigation: boolean;
    origin: string;
    referer: string;
    documentUrl: string;
    frameId: string;
  };
}
