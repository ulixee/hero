import '@ulixee/commons/lib/SourceMapSupport';
import ITypedEventEmitter from '@ulixee/commons/interfaces/ITypedEventEmitter';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import ITransportToClient, { ITransportToClientEvents } from '../interfaces/ITransportToClient';
import IApiHandlers from '../interfaces/IApiHandlers';
import ICoreResponsePayload from '../interfaces/ICoreResponsePayload';
import ICoreEventPayload from '../interfaces/ICoreEventPayload';

export default class EmittingTransportToClient<
    IClientApiSpec extends IApiHandlers,
    IEventSpec = any,
  >
  extends TypedEventEmitter<
    ITransportToClientEvents<IClientApiSpec> & {
      outbound: ICoreResponsePayload<IClientApiSpec, any> | ICoreEventPayload<IEventSpec, any>;
    }
  >
  implements
    ITransportToClient<IClientApiSpec, IEventSpec>,
    ITypedEventEmitter<
      ITransportToClientEvents<IClientApiSpec> & {
        outbound: ICoreResponsePayload<IClientApiSpec, any> | ICoreEventPayload<IEventSpec, any>;
      }
    >
{
  send(
    message: ICoreResponsePayload<IClientApiSpec, any> | ICoreEventPayload<IEventSpec, any>,
  ): Promise<void> {
    this.emit('outbound', message);
    return Promise.resolve();
  }
}
