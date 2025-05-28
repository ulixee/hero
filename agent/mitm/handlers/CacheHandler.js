"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ResourceState_1 = require("../interfaces/ResourceState");
const HeadersHandler_1 = require("./HeadersHandler");
const env_1 = require("../env");
class CacheHandler {
    get buffer() {
        return Buffer.concat(this.data);
    }
    get cacheData() {
        if (!this.shouldServeCachedData)
            return null;
        return this.buffer;
    }
    constructor(responseCache, ctx) {
        this.responseCache = responseCache;
        this.ctx = ctx;
        this.didProposeCachedResource = false;
        this.shouldServeCachedData = false;
        this.data = [];
    }
    onRequest() {
        const ctx = this.ctx;
        ctx.setState(ResourceState_1.default.CheckCacheOnRequest);
        if (!CacheHandler.isEnabled)
            return;
        // only cache get (don't do preflight, post, etc)
        if (ctx.method === 'GET' && !HeadersHandler_1.default.getRequestHeader(ctx, 'if-none-match')) {
            const cache = this.responseCache?.get(ctx.url.href);
            if (cache?.etag) {
                const key = this.ctx.isServerHttp2 ? 'if-none-match' : 'If-None-Match';
                ctx.requestHeaders[key] = cache.etag;
                this.didProposeCachedResource = true;
            }
        }
    }
    onHttp2PushStream() {
        this.ctx.setState(ResourceState_1.default.CheckCacheOnRequest);
        if (!CacheHandler.isEnabled)
            return;
        if (this.ctx.method === 'GET') {
            const cached = this.responseCache?.get(this.ctx.url.href);
            if (cached) {
                this.didProposeCachedResource = true;
                this.useCached();
            }
        }
    }
    onResponseData(chunk) {
        let data = chunk;
        if (this.shouldServeCachedData) {
            data = null;
        }
        else if (chunk) {
            this.data.push(chunk);
        }
        return data;
    }
    onResponseHeaders() {
        if (!CacheHandler.isEnabled)
            return;
        if (this.didProposeCachedResource && this.ctx.status === 304) {
            this.useCached();
            this.ctx.status = 200;
        }
    }
    onResponseEnd() {
        const ctx = this.ctx;
        ctx.setState(ResourceState_1.default.CheckCacheOnResponseEnd);
        if (!CacheHandler.isEnabled)
            return;
        if (ctx.method === 'GET' &&
            !this.didProposeCachedResource &&
            !ctx.didInterceptResource &&
            this.data.length) {
            const resHeaders = ctx.responseHeaders;
            this.responseCache?.add(ctx.url.href, Buffer.concat(this.data), resHeaders);
        }
    }
    useCached() {
        const { responseHeaders, url } = this.ctx;
        const cached = this.responseCache?.get(url.href);
        let isLowerKeys = false;
        for (const key of Object.keys(responseHeaders)) {
            if (key.toLowerCase() === key)
                isLowerKeys = true;
            if (key.match(/content-encoding/i) ||
                key.match(/transfer-encoding/i) ||
                key.match(/content-length/i)) {
                delete responseHeaders[key];
            }
        }
        if (cached.encoding) {
            const key = isLowerKeys ? 'content-encoding' : 'Content-Encoding';
            responseHeaders[key] = cached.encoding;
        }
        if (cached.contentType &&
            !responseHeaders['content-type'] &&
            !responseHeaders['Content-Type']) {
            const key = isLowerKeys ? 'content-type' : 'Content-Type';
            responseHeaders[key] = cached.contentType;
        }
        const lengthKey = isLowerKeys ? 'content-length' : 'Content-Length';
        responseHeaders[lengthKey] = String(Buffer.byteLength(cached.file, 'utf8'));
        this.shouldServeCachedData = true;
        this.data.push(cached.file);
    }
}
CacheHandler.isEnabled = env_1.default.enableMitmCache;
exports.default = CacheHandler;
//# sourceMappingURL=CacheHandler.js.map