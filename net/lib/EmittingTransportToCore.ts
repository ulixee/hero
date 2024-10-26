import ITypedEventEmitter from '@ulixee/commons/interfaces/ITypedEventEmitter';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import '@ulixee/commons/lib/SourceMapSupport';
import ITransport, { ITransportEvents } from '../interfaces/ITransport';

export default class EmittingTransportToCore
  extends TypedEventEmitter<
    ITransportEvents & {
      outbound: any;
    }
  >
  implements
    ITransport,
    ITypedEventEmitter<
      ITransportEvents & {
        outbound: any;
      }
    >
{
  host = 'direct';
  isConnected = true;

  send(message: any): Promise<void> {
    this.emit('outbound', message);
    return Promise.resolve();
  }

  connect(): Promise<void> {
    this.isConnected = true;
    this.emit('connected');
    return Promise.resolve();
  }

  disconnect(): void {
    this.isConnected = false;
    this.emit('disconnected');
  }
}
