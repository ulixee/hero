import HttpResponseCache from '../lib/HttpResponseCache';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import ResourceState from '../interfaces/ResourceState';

export default class CacheHandler {
  public didProposeCachedResource = false;
  public shouldServeCachedData = false;
  private readonly data: Buffer[] = [];

  public get buffer() {
    return Buffer.concat(this.data);
  }

  public get cacheData() {
    if (!this.shouldServeCachedData) return null;
    return this.buffer;
  }

  constructor(readonly responseCache: HttpResponseCache, readonly ctx: IMitmRequestContext) {}

  public onRequest() {
    const ctx = this.ctx;
    ctx.setState(ResourceState.CheckCacheOnRequest);

    // only cache get (don't do preflight, post, etc)
    if (ctx.method === 'GET' && !ctx.requestLowerHeaders['if-none-match']) {
      const cache = this.responseCache?.get(ctx.url.href);

      if (cache?.etag) {
        const key = this.ctx.isServerHttp2 ? 'if-none-match' : 'If-None-Match';
        ctx.requestHeaders[key] = cache.etag;
        this.didProposeCachedResource = true;
      }
    }
  }

  public onHttp2PushStream() {
    this.ctx.setState(ResourceState.CheckCacheOnRequest);
    if (this.ctx.method === 'GET') {
      const cached = this.responseCache?.get(this.ctx.url.href);
      if (cached) {
        this.didProposeCachedResource = true;
        this.useCached();
      }
    }
  }

  public onResponseData(chunk: Buffer) {
    let data = chunk;
    if (this.shouldServeCachedData) {
      data = null;
    } else if (chunk) {
      this.data.push(chunk);
    }
    return data;
  }

  public onResponseHeaders() {
    if (this.didProposeCachedResource && this.ctx.status === 304) {
      this.useCached();
      this.ctx.status = 200;
    }
  }

  public onResponseEnd() {
    const ctx = this.ctx;
    ctx.setState(ResourceState.CheckCacheOnResponseEnd);
    if (
      ctx.method === 'GET' &&
      !this.didProposeCachedResource &&
      !ctx.didBlockResource &&
      this.data.length
    ) {
      const resHeaders = ctx.responseHeaders;
      this.responseCache?.add(ctx.url.href, Buffer.concat(this.data), resHeaders);
    }
  }

  private useCached() {
    const { responseHeaders, url } = this.ctx;
    const cached = this.responseCache?.get(url.href);
    let isLowerKeys = false;
    for (const key of Object.keys(responseHeaders)) {
      if (key.toLowerCase() === key) isLowerKeys = true;
      if (
        key.match(/content-encoding/i) ||
        key.match(/transfer-encoding/i) ||
        key.match(/content-length/i)
      ) {
        delete responseHeaders[key];
      }
    }
    if (cached.encoding) {
      const key = isLowerKeys ? 'content-encoding' : 'Content-Encoding';
      responseHeaders[key] = cached.encoding;
    }
    const lengthKey = isLowerKeys ? 'content-length' : 'Content-Length';
    responseHeaders[lengthKey] = String(Buffer.byteLength(cached.file, 'utf8'));
    this.shouldServeCachedData = true;
    this.data.push(cached.file);
  }
}
