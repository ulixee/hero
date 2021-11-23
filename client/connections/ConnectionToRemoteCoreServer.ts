import * as WebSocket from 'ws';
import ICoreRequestPayload from '@ulixee/hero-interfaces/ICoreRequestPayload';
import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';
import { createPromise } from '@ulixee/commons/lib/utils';
import IResolvablePromise from '@ulixee/commons/interfaces/IResolvablePromise';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import ConnectionToCore from './ConnectionToCore';
import IConnectionToCoreOptions from '../interfaces/IConnectionToCoreOptions';
import DisconnectedFromCoreError from './DisconnectedFromCoreError';

export default class ConnectionToRemoteCoreServer extends ConnectionToCore {
  private webSocketOrError: IResolvablePromise<WebSocket | Error>;

  constructor(options: IConnectionToCoreOptions) {
    if (!options.host) throw new Error('A remote connection to core needs a host parameter!');
    super(options);
  }

  protected async internalSendRequest(payload: ICoreRequestPayload): Promise<void> {
    if (!this.webSocketOrError) throw new CanceledPromiseError('No websocket connection');
    const message = TypeSerializer.stringify(payload);

    const webSocket = await this.getWebsocket();

    if (webSocket?.readyState !== WebSocket.OPEN) {
      throw new CanceledPromiseError('Websocket was not open');
    }

    return new Promise((resolve, reject) =>
      webSocket.send(message, err => {
        if (err) {
          const { code } = err as any;
          if (code === 'EPIPE' && super.isDisconnecting) {
            return reject(new DisconnectedFromCoreError(this.resolvedHost));
          }
          reject(err);
        } else resolve();
      }),
    );
  }

  protected async destroyConnection(): Promise<any> {
    const webSocket = await this.getWebsocket(false);
    if (webSocket?.readyState === WebSocket.OPEN) {
      try {
        webSocket.off('close', this.onConnectionTerminated);
        webSocket.off('error', this.internalDisconnect);
        webSocket.terminate();
      } catch (_) {
        // ignore errors terminating
      }
    }
  }

  protected async createConnection(): Promise<Error | null> {
    // do this first to see if we can resolve the host
    const hostOrError = await this.hostOrError;
    if (hostOrError instanceof Error) return hostOrError;

    if (!this.webSocketOrError) {
      this.webSocketOrError = connectToWebsocketHost(hostOrError);
      try {
        const webSocket = await this.getWebsocket();
        webSocket.once('close', this.onConnectionTerminated);
        webSocket.once('error', this.internalDisconnect);
        webSocket.on('message', message => {
          const payload = TypeSerializer.parse(message.toString(), 'REMOTE CORE');
          this.onMessage(payload);
        });
      } catch (error) {
        return error;
      }
    }
  }

  private async getWebsocket(throwIfError = true): Promise<WebSocket> {
    if (!this.webSocketOrError) return null;
    const webSocketOrError = await this.webSocketOrError.promise;
    if (webSocketOrError instanceof Error) {
      if (throwIfError) throw webSocketOrError;
      return null;
    }
    return webSocketOrError;
  }
}

function connectToWebsocketHost(host: string): IResolvablePromise<WebSocket | Error> {
  const resolvable = createPromise<WebSocket | Error>(30e3);
  const webSocket = new WebSocket(host);
  function onError(error: Error): void {
    if (error instanceof Error) resolvable.resolve(error);
    else resolvable.resolve(new Error(`Error connecting to Websocket host -> ${error}`));
  }
  webSocket.once('close', onError);
  webSocket.once('error', onError);
  webSocket.once('open', () => {
    webSocket.off('error', onError);
    webSocket.off('close', onError);
    resolvable.resolve(webSocket);
  });
  return resolvable;
}
