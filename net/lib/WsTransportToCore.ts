import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import IResolvablePromise from '@ulixee/commons/interfaces/IResolvablePromise';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';
import { toUrl } from '@ulixee/commons/lib/utils';
import WebSocket = require('ws');
import DisconnectedError from '../errors/DisconnectedError';
import ITransport, { ITransportEvents } from '../interfaces/ITransport';
import { isWsOpen, sendWsCloseUnexpectedError, wsSend } from './WsUtils';

export default class WsTransportToCore
  extends TypedEventEmitter<ITransportEvents>
  implements ITransport
{
  public host: string;

  public isConnected = false;
  public isDisconnecting = false;

  private connectPromise: IResolvablePromise<void>;
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

  public async send(payload: any): Promise<void> {
    if (!isWsOpen(this.webSocket) && this.connectPromise) {
      await this.disconnect();
    }

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
    this.connectPromise = null;
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

  public async connect(timeoutMs?: number): Promise<void> {
    if (!this.connectPromise) {
      this.connectPromise = new Resolvable();

      await this.hostPromise;
      const webSocket = new WebSocket(this.host, {
        followRedirects: false,
        handshakeTimeout: timeoutMs,
      });
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
    await this.connectPromise;
    this.isConnected = true;
    this.emit('connected');
  }

  private onMessage(message: WebSocket.Data): void {
    const payload = TypeSerializer.parse(message.toString(), 'REMOTE CORE');
    this.emit('message', payload);
  }

  private onConnectError(error: Error): void {
    if (error instanceof Error) this.connectPromise.reject(error);
    else
      this.connectPromise.reject(new Error(`Error connecting to Websocket host -> ${error}`), true);
  }

  private setHost(host: string): void {
    const url = toUrl(host);
    this.host = url.href;
  }
}
