import IHttpHeaders from '@ulixee/unblocked-specification/agent/net/IHttpHeaders';
import IResourceRequest from '@ulixee/unblocked-specification/agent/net/IResourceRequest';
import IResourceMeta from '@ulixee/unblocked-specification/agent/net/IResourceMeta';
import CoreTab from './CoreTab';
export default class ResourceRequest {
    #private;
    readonly url: string;
    readonly timestamp: Date;
    readonly headers: IHttpHeaders;
    readonly trailers?: IHttpHeaders;
    readonly method: string;
    constructor(coreTab: Promise<CoreTab>, request: IResourceRequest, resourceId: number);
    get postData(): Promise<Buffer>;
}
export declare function createResourceRequest(coreTab: Promise<CoreTab>, resourceMeta: IResourceMeta): ResourceRequest;
