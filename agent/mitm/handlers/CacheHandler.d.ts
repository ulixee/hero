import HttpResponseCache from '../lib/HttpResponseCache';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
export default class CacheHandler {
    readonly responseCache: HttpResponseCache;
    readonly ctx: IMitmRequestContext;
    static isEnabled: boolean;
    didProposeCachedResource: boolean;
    shouldServeCachedData: boolean;
    private readonly data;
    get buffer(): Buffer;
    get cacheData(): Buffer | null;
    constructor(responseCache: HttpResponseCache, ctx: IMitmRequestContext);
    onRequest(): void;
    onHttp2PushStream(): void;
    onResponseData(chunk: Buffer): Buffer;
    onResponseHeaders(): void;
    onResponseEnd(): void;
    private useCached;
}
