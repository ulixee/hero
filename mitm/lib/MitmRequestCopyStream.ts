import { EventEmitter } from 'events';
import * as stream from 'stream';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';

export default class MitmRequestCopyStream extends EventEmitter {
  public writable = true;

  private readonly data: Buffer[] = [];

  constructor(
    readonly writeStream: stream.Writable,
    readonly ctx: IMitmRequestContext,
    readonly handleError: (ctx: IMitmRequestContext, err: Error) => null,
  ) {
    super();
  }

  public write(chunk) {
    try {
      if (chunk) {
        this.data.push(chunk);
        return this.writeStream.write(chunk);
      }
    } catch (err) {
      this.handleError(this.ctx, err);
    }
  }

  public end(chunk) {
    try {
      this.write(chunk);
      this.ctx.postData = Buffer.concat(this.data);
      this.writeStream.end();
    } catch (err) {
      this.handleError(this.ctx, err);
    }
  }
}
