import IDetachedResource from '@ulixee/hero-interfaces/IDetachedResource';
import IResourceType from '@ulixee/unblocked-specification/agent/net/IResourceType';
import IWebsocketMessage from '@ulixee/hero-interfaces/IWebsocketMessage';
import IDetachedResourceDetails from '../interfaces/IDetachedResourceDetails';
export default class DetachedResource implements IDetachedResourceDetails {
    #private;
    documentUrl: string;
    frameId: number;
    id: number;
    isRedirect: boolean;
    receivedAtCommandId: number;
    seenAtCommandId: number;
    tabId: number;
    type: IResourceType;
    url: string;
    messages: IWebsocketMessage[];
    get buffer(): Buffer;
    get json(): any;
    get text(): string;
    readonly request: IDetachedResourceDetails['request'];
    readonly response: IDetachedResourceDetails['response'];
    constructor(detachedResource: IDetachedResource);
}
