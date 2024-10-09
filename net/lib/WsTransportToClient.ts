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
  constructor(
    private webSocket: WebSocket,
    private request: IncomingMessage,
  ) {
    super();
    bindFunctions(this);
    this.events.on(webSocket, 'message', this.onMessage);
    this.events.on(webSocket, 'close', this.onClose);
    this.events.on(webSocket, 'error', this.onError);
    this.remoteId = `${request.socket.remoteAddress}:${request.socket.remotePort}`;
  }

  public async send(payload: any): Promise<void> {
    const message = TypeSerializer.stringify(payload);

    if (!isWsOpen(this.webSocket)) {
      const error = new CanceledPromiseError('Websocket was not open');
      this.onError(error);
      throw error;
    }

    try {
      await wsSend(this.webSocket, message);
    } catch (error) {
      if (!(error instanceof CanceledPromiseError)) {
        sendWsCloseUnexpectedError(this.webSocket, error.message);
      }
      throw error;
    }
  }

  private onClose(): void {
    this.isConnected = false;
    this.emit('disconnected', null);
    this.events.close();
  }

  private onError(error: Error): void {
    this.emit('disconnected', error);
    this.events.close();
  }

  private onMessage(message: WebSocket.Data): void {
    const payload = TypeSerializer.parse(message.toString(), 'CLIENT');
    this.emit('message', payload);
  }
}
