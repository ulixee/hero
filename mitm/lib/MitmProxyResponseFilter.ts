import { EventEmitter } from 'events';
import * as stream from 'stream';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import RequestEmitter from '../handlers/RequestEmitter';

export default class ProxyResponseFilter extends EventEmitter {
  public writable = true;
  constructor(
    readonly writeStream: stream.Writable,
    readonly ctx: IMitmRequestContext,
    readonly handleError: (ctx: IMitmRequestContext, err: Error) => null,
  ) {
    super();
  }

  public write(chunk) {
    this.modifyAndWrite(chunk);
    return true;
  }

  public end(chunk) {
    try {
      const ctx = this.ctx;
      this.modifyAndWrite(chunk);
      if (ctx.cacheHandler.shouldServeCachedData) {
        ctx.proxyToClientResponse.write(ctx.cacheHandler.cacheData);
      }
      this.writeStream.end();
      ctx.cacheHandler.onResponseEnd(ctx);
      RequestEmitter.emitHttpResponse(ctx, ctx.cacheHandler.buffer);
    } catch (err) {
      this.handleError(this.ctx, err);
    }
  }

  private modifyAndWrite(chunk) {
    try {
      const data = this.ctx.cacheHandler.onResponseData(this.ctx, chunk);
      if (data) {
        this.writeStream.write(data);
      }
    } catch (err) {
      this.handleError(this.ctx, err);
    }
  }
}
