import Core from '@ulixee/hero-core';
import { ConnectionToCore } from '@ulixee/hero';
import ICoreRequestPayload from '@ulixee/hero-interfaces/ICoreRequestPayload';
import ConnectionToClient from '@ulixee/hero-core/connections/ConnectionToClient';
import TypeSerializer from '@ulixee/commons/TypeSerializer';

export default class ConnectionToLocalCore extends ConnectionToCore {
  public static shouldSerialize = false;

  #connectionToClient: ConnectionToClient;

  protected async internalSendRequest(payload: ICoreRequestPayload): Promise<void> {
    if (ConnectionToLocalCore.shouldSerialize) {
      const json = TypeSerializer.stringify(payload);
      payload = TypeSerializer.parse(json.toString(), 'CLIENT');
    }
    await this.#connectionToClient.handleRequest(payload);
  }

  protected async destroyConnection(): Promise<any> {
    await this.#connectionToClient.disconnect();
  }

  protected async createConnection(): Promise<Error | null> {
    this.#connectionToClient = Core.addConnection();
    this.#connectionToClient.on('message', payload => {
      if (ConnectionToLocalCore.shouldSerialize) {
        const message = TypeSerializer.stringify(payload);
        payload = TypeSerializer.parse(message.toString(), 'LOCAL CORE');
      }
      this.onMessage(payload);
    });
    return await new Promise(resolve => setTimeout(resolve, 0));
  }
}
