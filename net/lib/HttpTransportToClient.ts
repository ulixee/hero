import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import '@ulixee/commons/lib/SourceMapSupport';
import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';
import { IncomingMessage, ServerResponse } from 'http';
import * as QueryString from 'querystring';
import { URL } from 'url';
import ICoreRequestPayload from '../interfaces/ICoreRequestPayload';
import ITransport, { ITransportEvents } from '../interfaces/ITransport';

const Kb = 1e3;

export default class HttpTransportToClient
  extends TypedEventEmitter<ITransportEvents>
  implements ITransport
{
  private static requestCounter = 1;

  public remoteId: string;
  public isConnected = true;

  constructor(
    public request: IncomingMessage,
    private response: ServerResponse,
  ) {
    super();
    this.remoteId = `${request.socket.remoteAddress}:${request.socket.remotePort}`;
  }

  public send(message: any): Promise<void> {
    const res = this.response;

    try {
      res.writeHead(200, {
        'Content-Type': 'text/json',
      });
      res.end(TypeSerializer.stringify(message));
    } catch (err) {
      res.writeHead(500);
      res.end(err.toString());
    }
    this.emit('disconnected');
    return Promise.resolve();
  }

  public async readRequest(
    maxPayloadKb = 1e3,
    dontEmit = false,
  ): Promise<ICoreRequestPayload<any, any>> {
    const req = this.request;
    const url = new URL(req.url, 'http://localhost/');

    let size = 0;
    const body: Buffer[] = [];
    const maxPayloadSize = maxPayloadKb * Kb;
    for await (const chunk of req) {
      size += (chunk as Buffer).length;
      if (size > maxPayloadSize) throw new Error('Max size exceeded!');
      body.push(chunk);
    }
    let args: any;
    if (body.length) {
      const bodyText = Buffer.concat(body).toString();
      if (
        req.headers['content-type'] === 'text/json' ||
        req.headers['content-type'] === 'application/json'
      ) {
        args = TypeSerializer.parse(bodyText);
      } else {
        args = QueryString.parse(bodyText);
      }
    }
    args ??= {};
    const queryParams = Object.fromEntries(url.searchParams.entries());
    Object.assign(args, queryParams);

    let message = args as ICoreRequestPayload<any, any>;
    if (!('command' in message)) {
      const command = url.pathname.replace(/\//g, '') as any;
      message = { command, args } as any;
    }
    message.messageId ??= String((HttpTransportToClient.requestCounter += 1));
    if (!dontEmit) {
      this.emit('message', message);
    }
    return message;
  }
}
