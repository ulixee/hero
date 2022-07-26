import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import * as https from 'https';
import * as http from 'http';
import { ClientRequest, IncomingHttpHeaders } from 'http';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import ITransportToCore, { ITransportToCoreEvents } from '../interfaces/ITransportToCore';
import IApiHandlers from '../interfaces/IApiHandlers';
import ICoreRequestPayload from '../interfaces/ICoreRequestPayload';
import ICoreResponsePayload from '../interfaces/ICoreResponsePayload';
import ICoreEventPayload from '../interfaces/ICoreEventPayload';
import RemoteError from '../errors/RemoteError';

export default class HttpTransportToCore<
    ApiHandlers extends IApiHandlers = any,
    RequestPayload = ICoreRequestPayload<IApiHandlers, any>,
    ResponsePayload = ICoreResponsePayload<IApiHandlers, any> | ICoreEventPayload<never, any>,
  >
  extends TypedEventEmitter<ITransportToCoreEvents<ApiHandlers, never, ResponsePayload>>
  implements ITransportToCore<ApiHandlers, never, RequestPayload, ResponsePayload>
{
  public readonly host: string;

  public isConnected = false;
  public isDisconnecting = false;

  private pendingRequestsToPromise = new Map<ClientRequest, Promise<any>>();

  private httpAgent = new http.Agent({
    keepAlive: true,
    keepAliveMsecs: 5e3,
  });

  private httpsAgent = new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 5e3,
  });

  constructor(host: string) {
    super();
    this.host = host;
    this.disconnect = this.disconnect.bind(this);
  }

  public async send(payload: RequestPayload): Promise<void> {
    await this.connect();

    const message = Buffer.from(TypeSerializer.stringify(payload));
    const url = new URL(`${(payload as any).command}`, `${this.host}/`);
    const result = await this.request(url, message, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    });
    const responseId = (payload as any).messageId;
    let responsePayload: ICoreResponsePayload<IApiHandlers, any> = {
      data: null,
      responseId,
    };
    try {
      if (!result.headers['content-type']?.includes('json')) {
        throw new RemoteError({ code: result.statusCode as any, message: result.body });
      }
      responsePayload = TypeSerializer.parse(result.body);
      if (result.statusCode !== 200 && !(responsePayload instanceof Error)) {
        responsePayload.data = new RemoteError(responsePayload.data);
      }
    } catch (error) {
      responsePayload.data = error;
    }
    responsePayload.responseId ??= responseId;
    this.emit('message', responsePayload as any);
  }

  public async disconnect(): Promise<void> {
    if (this.isDisconnecting) return;
    this.isDisconnecting = true;
    await Promise.allSettled(this.pendingRequestsToPromise.values());
    this.emit('disconnected');
    this.isConnected = false;
    return Promise.resolve();
  }

  public connect(): Promise<void> {
    if (!this.isConnected) {
      this.isConnected = true;
      this.emit('connected');
    }
    return Promise.resolve();
  }

  private request(
    url: URL,
    payload: Buffer,
    options: https.RequestOptions,
  ): Promise<{ statusCode: number; body: string; headers: IncomingHttpHeaders }> {
    if (this.isDisconnecting) {
      throw new CanceledPromiseError('Canceling request due to disconnected state');
    }
    const httpModule = url.protocol === 'https:' ? https : http;
    options.agent ??= url.protocol === 'https:' ? this.httpsAgent : this.httpAgent;

    const resolvable = new Resolvable<{
      statusCode: number;
      body: string;
      headers: IncomingHttpHeaders;
    }>();

    const request = httpModule.request(url, options, async res => {
      this.pendingRequestsToPromise.delete(request);

      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url);
        return resolvable.resolve(this.request(redirectUrl, payload, options));
      }
      res.once('error', resolvable.reject);

      const body: Buffer[] = [];
      for await (const chunk of res) {
        body.push(chunk);
      }
      resolvable.resolve({
        body: Buffer.concat(body).toString(),
        statusCode: res.statusCode,
        headers: res.headers,
      });
    });
    this.pendingRequestsToPromise.set(request, resolvable.promise);
    request.setSocketKeepAlive(true);
    request.once('error', resolvable.reject);
    request.end(payload);
    return resolvable.promise;
  }
}
