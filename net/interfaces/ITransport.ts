import ITypedEventEmitter from '@ulixee/commons/interfaces/ITypedEventEmitter';

export default interface ITransport extends ITypedEventEmitter<ITransportEvents> {
  host?: string;
  remoteId?: string;
  isConnected: boolean;
  connect?(timeoutMs?: number): Promise<void>;
  disconnect?(fatalError?: Error): Promise<void> | void;
  send(message: any): Promise<void>;
}

export interface ITransportEvents {
  message: any;
  disconnected: Error | null;
  connected: void;
}
