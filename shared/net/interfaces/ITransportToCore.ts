import ITypedEventEmitter from '@ulixee/commons/interfaces/ITypedEventEmitter';
import ICoreRequestPayload from './ICoreRequestPayload';
import ICoreResponsePayload from './ICoreResponsePayload';
import ICoreEventPayload from './ICoreEventPayload';
import IApiHandlers from './IApiHandlers';

export default interface ITransportToCore<
  ApiHandlers extends IApiHandlers = any,
  EventSpec = any,
  RequestPayload = ICoreRequestPayload<ApiHandlers, any>,
  ResponsePayload = ICoreResponsePayload<ApiHandlers, any> | ICoreEventPayload<EventSpec, any>,
> extends ITypedEventEmitter<ITransportToCoreEvents<ApiHandlers, EventSpec, ResponsePayload>> {
  host: string;
  isConnected: boolean;
  connect?(timeoutMs?: number): Promise<void | Error>;
  disconnect?(): Promise<void>;
  send(message: RequestPayload): Promise<void>;
}

export interface ITransportToCoreEvents<
  ApiHandlers extends IApiHandlers,
  EventSpec = any,
  ResponsePayload = ICoreResponsePayload<ApiHandlers, any> | ICoreEventPayload<EventSpec, any>,
> {
  message: ResponsePayload;
  disconnected: void;
  connected: void;
}
