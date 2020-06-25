import HttpResponseCache from '../lib/HttpResponseCache';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import Log from '@secret-agent/shared-logger';

const { log } = Log(module);

export default class CacheHandler {
  public didUseArtificialCache = false;
  public shouldServeCachedData = false;
  private readonly data: Buffer[] = [];

  public get buffer() {
    return Buffer.concat(this.data);
  }

  public get cacheData() {
    if (!this.shouldServeCachedData) return null;
    return this.buffer;
  }

  constructor(readonly responseCache: HttpResponseCache) {}

  public onRequest(ctx: IMitmRequestContext) {
    const request = ctx.clientToProxyRequest;
    // only cache get (don't do preflight, post, etc)
    if (request.method === 'GET') {
      const cache = this.responseCache.get(ctx.url);

      if (cache?.etag) {
        ctx.proxyToServerRequestSettings.headers['If-None-Match'] = cache.etag;
        this.didUseArtificialCache = true;
      }
    }
  }

  public onResponseData(ctx: IMitmRequestContext, chunk: Buffer) {
    let data = chunk;
    if (this.shouldServeCachedData) {
      data = null;
    } else if (chunk) {
      this.data.push(chunk);
    }
    return data;
  }

  public onResponseHeaders(ctx: IMitmRequestContext) {
    if (this.didUseArtificialCache && ctx.serverToProxyResponse.statusCode === 304) {
      const cached = this.responseCache.get(ctx.url);
      if (cached.encoding) {
        ctx.serverToProxyResponse.headers['content-encoding'] = cached.encoding;
      }
      delete ctx.serverToProxyResponse.headers['transfer-encoding'];
      ctx.serverToProxyResponse.headers['content-length'] = String(
        Buffer.byteLength(cached.file, 'utf8'),
      );
      ctx.serverToProxyResponse.statusCode = 200;
      this.shouldServeCachedData = true;
      this.data.push(cached.file);
    }
  }

  public onResponseEnd(ctx: IMitmRequestContext) {
    if (
      ctx.serverToProxyResponse.method === 'GET' &&
      !this.didUseArtificialCache &&
      !ctx.didBlockResource
    ) {
      const resHeaders = ctx.serverToProxyResponse.headers;
      this.responseCache.add(ctx.url, Buffer.concat(this.data), resHeaders);
    }
  }
}
