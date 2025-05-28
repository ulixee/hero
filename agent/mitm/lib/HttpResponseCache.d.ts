import IHttpHeaders from '@ulixee/unblocked-specification/agent/net/IHttpHeaders';
export default class HttpResponseCache {
    readonly maxItems: number;
    private readonly cache;
    private readonly accessList;
    constructor(maxItems?: number);
    get(url: string): IResource | null;
    add(url: string, file: Buffer, headers: IHttpHeaders): void;
    private recordAccess;
    private cleanCache;
}
interface IResource {
    file: Buffer;
    etag: string;
    cacheControl: string;
    contentType: string;
    lastModified: string;
    expires: string;
    encoding: string;
}
export {};
