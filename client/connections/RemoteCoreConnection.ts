import ICoreRequestPayload from '@secret-agent/core-interfaces/ICoreRequestPayload';
import WebSocket from 'ws';
import CoreClientConnection from './CoreClientConnection';
import ICoreConnectionOptions from '../interfaces/ICoreConnectionOptions';

export default class RemoteCoreConnection extends CoreClientConnection {
  private wsConnectPromise: Promise<any>;
  private webSocket: WebSocket;

  constructor(options: ICoreConnectionOptions) {
    super(options);
    if (!options.host) throw new Error('A remote core connection needs a host parameter!');
  }

  public internalSendRequest(payload: ICoreRequestPayload): Promise<void> {
    const message = JSON.stringify(payload);
    return new Promise((resolve, reject) =>
      this.webSocket.send(message, err => {
        if (err) reject(err);
        else resolve();
      }),
    );
  }

  public async disconnect(): Promise<void> {
    if (
      this.webSocket &&
      this.webSocket.readyState !== WebSocket.CLOSED &&
      this.webSocket.readyState !== WebSocket.CLOSING
    ) {
      await super.disconnect();
      this.webSocket.terminate();
    }
    this.webSocket = null;
  }

  public connect(): Promise<Error | null> {
    if (!this.wsConnectPromise) {
      this.wsConnectPromise = this.wsConnect().catch(err => err);
    }

    return this.wsConnectPromise;
  }

  public isRemoteConnection(): boolean {
    return false;
  }

  private async wsConnect(): Promise<void> {
    let host = this.options.host;
    if (!host.includes('://')) {
      host = `ws://${host}`;
    }

    this.webSocket = new WebSocket(host);
    await new Promise<void>((resolve, reject) => {
      this.webSocket.on('error', reject);
      this.webSocket.once('open', () => {
        this.webSocket.off('error', reject);
        resolve();
      });
    });
    this.webSocket.once('close', this.disconnect.bind(this));
    this.webSocket.on('message', message => {
      const payload = JSON.parse(message.toString());
      this.onMessage(payload);
    });

    await super.connect();
  }
}
