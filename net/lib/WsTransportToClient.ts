import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';
import { bindFunctions } from '@ulixee/commons/lib/utils';
import { IncomingMessage } from 'http';
import WebSocket = require('ws');
import ITransport, { ITransportEvents } from '../interfaces/ITransport';
import { isWsOpen, sendWsCloseUnexpectedError, wsSend } from './WsUtils';

export default class WsTransportToClient
  extends TypedEventEmitter<ITransportEvents>
  implements ITransport
{
  public remoteId: string;
  public isConnected = true;
  private events = new EventSubscriber();
  private readonly keepAlive: NodeJS.Timeout;
  private lastActivity: number | null;

  constructor(
    private webSocket: WebSocket,
    private request: IncomingMessage,
  ) {
    super();
    bindFunctions(this);
    this.events.on(webSocket, 'message', this.onMessage);
    this.events.on(webSocket, 'close', this.onDisconnect.bind(this, null));
    this.events.on(webSocket, 'error', this.onDisconnect);
    this.events.on(webSocket, 'pong', this.onPong);
    this.remoteId = `${request.socket.remoteAddress}:${request.socket.remotePort}`;
    this.lastActivity = Date.now();
    this.keepAlive = setInterval(this.checkAlive, 1000 * 10).unref();
  }

  public async send(payload: any): Promise<void> {
    const message = TypeSerializer.stringify(payload);

    try {
      await wsSend(this.webSocket, message);
      this.lastActivity = Date.now();
    } catch (error) {
      if (!isWsOpen(this.webSocket)) {
        this.onDisconnect(error);
      }
      if (!(error instanceof CanceledPromiseError)) {
        sendWsCloseUnexpectedError(this.webSocket, error.message);
      }
      throw error;
    }
  }

  public disconnect(fatalError?: Error): void {
    if (isWsOpen(this.webSocket)) {
      this.webSocket.close();
    }
    this.onDisconnect(fatalError);
  }

  private checkAlive(): void {
    if (Date.now() - this.lastActivity > 30_000) {
      this.onDisconnect(new Error('No activity'));
      return;
    }
    this.webSocket.ping();
  }

  private onPong(): void {
    this.lastActivity = Date.now();
  }

  private onDisconnect(error: Error): void {
    this.isConnected = false;
    clearInterval(this.keepAlive);
    this.emit('disconnected', error);
    this.events.close();
  }

  private onMessage(message: WebSocket.Data): void {
    this.lastActivity = Date.now();
    const payload = TypeSerializer.parse(message.toString(), 'CLIENT');
    this.emit('message', payload);
  }
}
