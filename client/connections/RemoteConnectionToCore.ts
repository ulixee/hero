import ICoreRequestPayload from '@secret-agent/core-interfaces/ICoreRequestPayload';
import WebSocket from 'ws';
import TypeSerializer from '@secret-agent/commons/TypeSerializer';
import ConnectionToCore from './ConnectionToCore';
import IConnectionToCoreOptions from '../interfaces/IConnectionToCoreOptions';

export default class RemoteConnectionToCore extends ConnectionToCore {
  private wsConnectPromise: Promise<any>;
  private webSocket: WebSocket;

  constructor(options: IConnectionToCoreOptions) {
    super(options);
    const host = options.host;
    if (!host) throw new Error('A remote connection to core needs a host parameter!');

    this.hostOrError = Promise.resolve(host)
      .then(x => {
        if (!x.includes('://')) {
          return `ws://${x}`;
        }
        return x;
      })
      .catch(err => err);
  }

  public internalSendRequest(payload: ICoreRequestPayload): Promise<void> {
    const message = TypeSerializer.stringify(payload);
    return new Promise((resolve, reject) =>
      this.webSocket.send(message, err => {
        if (err) reject(err);
        else resolve();
      }),
    );
  }

  public async disconnect(): Promise<void> {
    if (this.wsConnectPromise && this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      this.wsConnectPromise = null;
      await super.disconnect();
      try {
        this.webSocket.terminate();
      } catch (_) {
        // ignore errors terminating
      }
    }
  }

  public connect(): Promise<Error | null> {
    if (!this.wsConnectPromise) {
      this.wsConnectPromise = this.wsConnect().catch(err => err);
    }

    return this.wsConnectPromise;
  }

  private async wsConnect(): Promise<void> {
    const hostOrError = await this.hostOrError;
    if (hostOrError instanceof Error) throw hostOrError;

    this.webSocket = new WebSocket(hostOrError);
    await new Promise<void>((resolve, reject) => {
      this.webSocket.on('error', reject);
      this.webSocket.once('open', () => {
        this.webSocket.off('error', reject);
        resolve();
      });
    });
    this.webSocket.once('close', this.disconnect.bind(this));
    this.webSocket.on('message', message => {
      const payload = TypeSerializer.parse(message.toString());
      this.onMessage(payload);
    });

    await super.connect();
  }
}
