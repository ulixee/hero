import ITypedEventEmitter from '@ulixee/commons/interfaces/ITypedEventEmitter';
import ICoreEventPayload from './ICoreEventPayload';
import IApiHandlers from './IApiHandlers';
import ITransportToClient from './ITransportToClient';

export default interface IConnectionToClient<IClientApiSpec extends IApiHandlers, IEventSpec = any>
  extends ITypedEventEmitter<IConnectionToClientEvents> {
  transport: ITransportToClient<IClientApiSpec, IEventSpec>;
  disconnectPromise: Promise<void>;
  disconnect(error?: Error): Promise<void>;
  sendEvent<T extends keyof IEventSpec>(event: ICoreEventPayload<IEventSpec, T>): void;
}

export interface IConnectionToClientEvents {
  'send-error': Error;
  disconnected: Error | null;
}
