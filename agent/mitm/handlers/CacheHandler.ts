import HttpResponseCache from '../lib/HttpResponseCache';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import ResourceState from '../interfaces/ResourceState';
import HeadersHandler from './HeadersHandler';
import env from '../env';

export default class CacheHandler {
  public static isEnabled = env.enableMitmCache;
  public didProposeCachedResource = false;
  public shouldServeCachedData = false;
  private readonly data: Buffer[] = [];

  public get buffer(): Buffer {
    return Buffer.concat(this.data);
  }

  public get cacheData(): Buffer | null {
    if (!this.shouldServeCachedData) return null;
    return this.buffer;
  }

  constructor(readonly responseCache: HttpResponseCache, readonly ctx: IMitmRequestContext) {}

  public onRequest(): void {
    const ctx = this.ctx;
    ctx.setState(ResourceState.CheckCacheOnRequest);
    if (!CacheHandler.isEnabled) return;

    // only cache get (don't do preflight, post, etc)
    if (ctx.method === 'GET' && !HeadersHandler.getRequestHeader(ctx, 'if-none-match')) {
      const cache = this.responseCache?.get(ctx.url.href);

      if (cache?.etag) {
        const key = this.ctx.isServerHttp2 ? 'if-none-match' : 'If-None-Match';
        ctx.requestHeaders[key] = cache.etag;
        this.didProposeCachedResource = true;
      }
    }
  }

  public onHttp2PushStream(): void {
    this.ctx.setState(ResourceState.CheckCacheOnRequest);
    if (!CacheHandler.isEnabled) return;
    if (this.ctx.method === 'GET') {
      const cached = this.responseCache?.get(this.ctx.url.href);
      if (cached) {
        this.didProposeCachedResource = true;
        this.useCached();
      }
    }
  }

  public onResponseData(chunk: Buffer): Buffer {
    let data = chunk;
    if (this.shouldServeCachedData) {
      data = null;
    } else if (chunk) {
      this.data.push(chunk);
    }
    return data;
  }

  public onResponseHeaders(): void {
    if (!CacheHandler.isEnabled) return;
    if (this.didProposeCachedResource && this.ctx.status === 304) {
      this.useCached();
      this.ctx.status = 200;
    }
  }

  public onResponseEnd(): void {
    const ctx = this.ctx;
    ctx.setState(ResourceState.CheckCacheOnResponseEnd);
    if (!CacheHandler.isEnabled) return;
    if (
      ctx.method === 'GET' &&
      !this.didProposeCachedResource &&
      !ctx.didInterceptResource &&
      this.data.length
    ) {
      const resHeaders = ctx.responseHeaders;
      this.responseCache?.add(ctx.url.href, Buffer.concat(this.data), resHeaders);
    }
  }

  private useCached(): void {
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
    if (
      cached.contentType &&
      !responseHeaders['content-type'] &&
      !responseHeaders['Content-Type']
    ) {
      const key = isLowerKeys ? 'content-type' : 'Content-Type';
      responseHeaders[key] = cached.contentType;
    }
    const lengthKey = isLowerKeys ? 'content-length' : 'Content-Length';
    responseHeaders[lengthKey] = String(Buffer.byteLength(cached.file, 'utf8'));
    this.shouldServeCachedData = true;
    this.data.push(cached.file);
  }
}
