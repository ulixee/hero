import IResolvablePromise from '@ulixee/commons/interfaces/IResolvablePromise';
import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';
import * as WebSocket from 'ws';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import DisconnectedError from '../errors/DisconnectedError';
import { isWsOpen, sendWsCloseUnexpectedError, wsSend } from './WsUtils';
import ITransportToCore, { ITransportToCoreEvents } from '../interfaces/ITransportToCore';
import IApiHandlers from '../interfaces/IApiHandlers';
import ICoreRequestPayload from '../interfaces/ICoreRequestPayload';
import ICoreResponsePayload from '../interfaces/ICoreResponsePayload';
import ICoreEventPayload from '../interfaces/ICoreEventPayload';

export default class WsTransportToCore<
    ApiHandlers extends IApiHandlers = any,
    EventSpec = any,
    RequestPayload = ICoreRequestPayload<IApiHandlers, any>,
    ResponsePayload = ICoreResponsePayload<IApiHandlers, any> | ICoreEventPayload<EventSpec, any>,
  >
  extends TypedEventEmitter<ITransportToCoreEvents<ApiHandlers, EventSpec, ResponsePayload>>
  implements ITransportToCore<ApiHandlers, EventSpec, RequestPayload, ResponsePayload>
{
  public host: string;

  public isConnected = false;
  public isDisconnecting = false;

  private connectPromise: IResolvablePromise<Error | null>;
  private webSocket: WebSocket;
  private events = new EventSubscriber();
  private readonly hostPromise: Promise<void>;

  constructor(host: string | Promise<string>) {
    super();
    if (typeof host === 'string') {
      this.setHost(host);
    }
    this.onMessage = this.onMessage.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.onConnectError = this.onConnectError.bind(this);
    this.setHost = this.setHost.bind(this);
    this.hostPromise = Promise.resolve(host).then(this.setHost);
  }

  public async send(payload: RequestPayload): Promise<void> {
    await this.connect();

    const message = TypeSerializer.stringify(payload);
    try {
      await wsSend(this.webSocket, message);
    } catch (error) {
      const { code } = error as any;
      if (code === 'EPIPE' && this.isDisconnecting) {
        throw new DisconnectedError(this.host);
      }
      if (!(error instanceof CanceledPromiseError)) {
        sendWsCloseUnexpectedError(this.webSocket, error.message);
      }
      throw error;
    }
  }

  public disconnect(): Promise<void> {
    if (this.isDisconnecting) return;
    this.isDisconnecting = true;
    this.emit('disconnected');
    this.isConnected = false;
    this.events.close('error');
    const webSocket = this.webSocket;
    this.webSocket = null;
    if (isWsOpen(webSocket)) {
      try {
        webSocket.terminate();
      } catch (_) {
        // ignore errors terminating
      }
    }
    return Promise.resolve();
  }

  public async connect(): Promise<void> {
    if (!this.connectPromise) {
      this.connectPromise = new Resolvable();

      await this.hostPromise;
      const webSocket = new WebSocket(this.host);
      this.events.group(
        'preConnect',
        this.events.once(webSocket, 'close', this.onConnectError),
        this.events.once(webSocket, 'error', this.onConnectError),
      );
      this.events.once(webSocket, 'open', () => {
        this.events.once(webSocket, 'close', this.disconnect);
        this.events.on(webSocket, 'error', this.disconnect);
        this.events.endGroup('preConnect');
        this.connectPromise.resolve();
      });

      this.webSocket = webSocket;
      this.events.on(webSocket, 'message', this.onMessage);
    }
    const connectOrError = await this.connectPromise;
    if (connectOrError) throw connectOrError;
    this.isConnected = true;
    this.emit('connected');
  }

  private onMessage(message: WebSocket.Data): void {
    const payload = TypeSerializer.parse(message.toString(), 'REMOTE CORE');
    this.emit('message', payload);
  }

  private onConnectError(error: Error): void {
    if (error instanceof Error) this.connectPromise.resolve(error);
    else this.connectPromise.resolve(new Error(`Error connecting to Websocket host -> ${error}`));
  }

  private setHost(host: string): void {
    if (!host.includes('://')) {
      this.host = `ws://${host}`;
    } else {
      this.host = host;
    }
    if (!this.host.startsWith('ws') && !this.host.startsWith('http')) {
      const url = new URL(this.host);
      url.protocol = 'ws:';
      this.host = url.href;
    }
  }
}
