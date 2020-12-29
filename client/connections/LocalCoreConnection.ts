import ICoreRequestPayload from '@secret-agent/core-interfaces/ICoreRequestPayload';
import ICoreServerConnection from '@secret-agent/core-interfaces/ICoreServerConnection';
import { ICoreConnectionOptions } from '../index';
import CoreClientConnection from './CoreClientConnection';

export default class LocalCoreConnection extends CoreClientConnection {
  public static create?: (options: ICoreConnectionOptions) => LocalCoreConnection;

  constructor(
    options: ICoreConnectionOptions,
    readonly coreServerConnection: ICoreServerConnection,
  ) {
    super(options);
    coreServerConnection.on('message', payload => this.onMessage(payload));
  }

  internalSendRequest(payload: ICoreRequestPayload): void | Promise<void> {
    return this.coreServerConnection.handleRequest(payload);
  }
}
