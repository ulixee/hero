import HttpResponseCache from "../lib/HttpResponseCache";
import IMitmRequestContext from "../interfaces/IMitmRequestContext";

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
    // only cache get (don't do preflight, post, etc)
    if (ctx.method === 'GET') {
      const cache = this.responseCache.get(ctx.url.href);

      if (cache?.etag) {
        ctx.requestHeaders['If-None-Match'] = cache.etag;
        this.didProposeCachedResource = true;
      }
    }
  }

  public onHttp2PushStream() {
    if (this.ctx.method === 'GET') {
      const cached = this.responseCache.get(this.ctx.url.href);
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
    if (
      ctx.method === 'GET' &&
      !this.didProposeCachedResource &&
      !ctx.didBlockResource &&
      this.data.length
    ) {
      const resHeaders = ctx.responseHeaders;
      this.responseCache.add(ctx.url.href, Buffer.concat(this.data), resHeaders);
    }
  }

  private useCached() {
    const ctx = this.ctx;
    const cached = this.responseCache.get(ctx.url.href);
    let isLowerKeys = false;
    for (const key of Object.keys(ctx.responseHeaders)) {
      if (key.toLowerCase() === key) isLowerKeys = true;
      if (
        key.match(/content-encoding/i) ||
        key.match(/transfer-encoding/i) ||
        key.match(/content-length/i)
      ) {
        delete ctx.responseHeaders[key];
      }
    }
    if (cached.encoding) {
      const key = isLowerKeys ? 'content-encoding' : 'Content-Encoding';
      ctx.responseHeaders[key] = cached.encoding;
    }
    const lengthKey = isLowerKeys ? 'content-length' : 'Content-Length';
    ctx.responseHeaders.headers[lengthKey] = String(Buffer.byteLength(cached.file, 'utf8'));
    this.shouldServeCachedData = true;
    this.data.push(cached.file);
  }
}
