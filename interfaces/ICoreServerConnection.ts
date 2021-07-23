import ITypedEventEmitter from '@ulixee/commons/interfaces/ITypedEventEmitter';
import ICoreRequestPayload from './ICoreRequestPayload';
import ICoreResponsePayload from './ICoreResponsePayload';
import ICoreEventPayload from './ICoreEventPayload';

export default interface ICoreServerConnection
  extends ITypedEventEmitter<{ message: ICoreResponsePayload | ICoreEventPayload }> {
  handleRequest(payload: ICoreRequestPayload): void | Promise<void>;
}
