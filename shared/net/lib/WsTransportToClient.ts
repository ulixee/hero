import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';
import * as WebSocket from 'ws';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import ITransportToClient, { ITransportToClientEvents } from '../interfaces/ITransportToClient';
import { sendWsCloseUnexpectedError, wsSend } from './WsUtils';
import IApiHandlers from '../interfaces/IApiHandlers';

export default class WsTransportToClient<IClientApiSpec extends IApiHandlers, IEventSpec = any>
  extends TypedEventEmitter<ITransportToClientEvents<IClientApiSpec>>
  implements ITransportToClient<IClientApiSpec, IEventSpec>
{
  private events = new EventSubscriber();
  constructor(private webSocket: WebSocket) {
    super();
    this.onMessage = this.onMessage.bind(this);
    this.events.on(webSocket, 'message', this.onMessage);
    this.events.on(webSocket, 'close', this.onClose);
    this.events.on(webSocket, 'error', this.onError);
  }

  public async send(payload: any): Promise<void> {
    const message = TypeSerializer.stringify(payload);
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
    this.emit('disconnected', null);
  }

  private onError(error: Error): void {
    this.emit('disconnected', error);
  }

  private onMessage(message: WebSocket.Data): void {
    const payload = TypeSerializer.parse(message.toString(), 'CLIENT');
    this.emit('message', payload);
  }
}
