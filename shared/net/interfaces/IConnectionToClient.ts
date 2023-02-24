import ITypedEventEmitter from '@ulixee/commons/interfaces/ITypedEventEmitter';
import ICoreEventPayload from './ICoreEventPayload';
import IApiHandlers from './IApiHandlers';
import ITransportToClient from './ITransportToClient';
import ICoreRequestPayload from './ICoreRequestPayload';
import ICoreResponsePayload from './ICoreResponsePayload';

export default interface IConnectionToClient<IClientApiSpec extends IApiHandlers, IEventSpec = any>
  extends ITypedEventEmitter<IConnectionToClientEvents> {
  transport: ITransportToClient<IClientApiSpec, IEventSpec>;
  disconnectPromise: Promise<void>;
  disconnect(error?: Error): Promise<void>;
  sendEvent<T extends keyof IEventSpec>(event: ICoreEventPayload<IEventSpec, T>): void;
}

export interface IConnectionToClientEvents<
  IClientApiSpec extends IApiHandlers = IApiHandlers,
  TKeys extends keyof IClientApiSpec & string = keyof IClientApiSpec & string,
> {
  'send-error': Error;
  disconnected: Error | null;
  request: { request: ICoreRequestPayload<IClientApiSpec, TKeys> };
  response: {
    request: ICoreRequestPayload<IClientApiSpec, TKeys>;
    response: ICoreResponsePayload<IClientApiSpec, TKeys>;
  };
  event: { event: ICoreEventPayload<unknown> };
}
