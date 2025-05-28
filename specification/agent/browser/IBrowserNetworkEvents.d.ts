import IHttpResourceLoadDetails from '../net/IHttpResourceLoadDetails';
import Protocol from 'devtools-protocol';
import RequestWillBeSentEvent = Protocol.Network.RequestWillBeSentEvent;
export declare type IBrowserResourceRequest = Omit<IHttpResourceLoadDetails, 'requestTrailers' | 'responseTrailers' | 'requestOriginalHeaders' | 'responseOriginalHeaders'> & {
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
        headers: {
            [key: string]: string;
        };
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
    'internal-request': {
        request: RequestWillBeSentEvent;
    };
}
