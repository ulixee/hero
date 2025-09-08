import IHttpHeaders from '@ulixee/unblocked-specification/agent/net/IHttpHeaders';
import IResourceResponse from '@ulixee/unblocked-specification/agent/net/IResourceResponse';
import IHttpResourceLoadDetails from '@ulixee/unblocked-specification/agent/net/IHttpResourceLoadDetails';
import IResourceMeta from '@ulixee/unblocked-specification/agent/net/IResourceMeta';
import CoreTab from './CoreTab';
export default class ResourceResponse {
    #private;
    readonly url: string;
    readonly timestamp: Date;
    readonly headers: IHttpHeaders;
    readonly trailers?: IHttpHeaders;
    readonly browserServedFromCache?: IHttpResourceLoadDetails['browserServedFromCache'];
    readonly browserLoadFailure?: string;
    readonly browserLoadedTime?: Date;
    readonly remoteAddress: string;
    readonly statusCode: number;
    readonly statusMessage?: string;
    readonly bodyBytes?: number;
    constructor(coreTab: Promise<CoreTab>, response: IResourceResponse, resourceId: number);
    get buffer(): Promise<Buffer>;
    get text(): Promise<string>;
    get json(): Promise<any>;
}
export declare function createResourceResponse(coreTab: Promise<CoreTab>, resourceMeta?: IResourceMeta): ResourceResponse;
