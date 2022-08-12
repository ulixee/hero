import ITypedEventEmitter from '@ulixee/commons/interfaces/ITypedEventEmitter';
import IApiHandlers from './IApiHandlers';
import ICoreRequestPayload from './ICoreRequestPayload';
import ICoreResponsePayload from './ICoreResponsePayload';
import ICoreEventPayload from './ICoreEventPayload';

export default interface ITransportToClient<
  IClientApiHandlers extends IApiHandlers,
  IEventSpec = any,
  OutMessagePayload =
    | ICoreResponsePayload<IClientApiHandlers, any>
    | ICoreEventPayload<IEventSpec, any>,
> extends ITypedEventEmitter<ITransportToClientEvents<IClientApiHandlers>> {
  remoteId: string;
  send(message: OutMessagePayload): Promise<void>;
  disconnect?(fatalError?: Error): Promise<void> | void;
}

export interface ITransportToClientEvents<IClientApiSpec extends IApiHandlers> {
  message: ICoreRequestPayload<IClientApiSpec, any>;
  disconnected: Error | null;
}
