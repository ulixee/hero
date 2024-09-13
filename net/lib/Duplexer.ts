import { ConnectionToClient } from '../index';
import IApiHandlers from '../interfaces/IApiHandlers';
import ConnectionToCore from './ConnectionToCore';

export default class Duplexer {
  public static fromCore<TApiHandlers extends IApiHandlers, TEventSpec>(
    connectionToCore: ConnectionToCore<TApiHandlers, TEventSpec>,
    handlers: TApiHandlers,
  ): ConnectionToClient<TApiHandlers, TEventSpec> {
    return new ConnectionToClient(connectionToCore.transport, handlers);
  }

  public static fromClient<TApiHandlers extends IApiHandlers, TEventSpec>(
    connectionToClient: ConnectionToClient<TApiHandlers, TEventSpec>,
  ): ConnectionToCore<TApiHandlers, TEventSpec> {
    return new ConnectionToCore(connectionToClient.transport);
  }
}
