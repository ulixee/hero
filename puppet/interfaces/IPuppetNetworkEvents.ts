import ResourceType from '@secret-agent/core-interfaces/ResourceType';

export interface IPuppetNetworkEvents {
  navigationResponse: {
    browserRequestId: string;
    frameId: string;
    status: number;
    location?: string;
    url?: string;
  };
  websocketFrame: {
    browserRequestId: string;
    message: string | Buffer;
    isFromServer: boolean;
  };
  websocketHandshake: {
    browserRequestId: string;
    headers: { [key: string]: string };
  };
  resourceWillBeRequested: {
    browserRequestId: string;
    resourceType: ResourceType;
    url: string;
    method: string;
    hasUserGesture: boolean;
    isDocumentNavigation: boolean;
    documentUrl: string;
    frameId: string;
  };
}
