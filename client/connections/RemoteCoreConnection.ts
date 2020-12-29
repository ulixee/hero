import JsonSocket from 'json-socket';
import Net from 'net';
import ICoreRequestPayload from '@secret-agent/core-interfaces/ICoreRequestPayload';
import { URL } from 'url';
import CoreClientConnection from './CoreClientConnection';
import ICoreConnectionOptions from '../interfaces/ICoreConnectionOptions';

export default class RemoteCoreConnection extends CoreClientConnection {
  protected netConnectPromise: Promise<any>;
  private netSocket: Net.Socket;
  private jsonSocket: JsonSocket;

  constructor(options: ICoreConnectionOptions) {
    super(options);
    if (!options.host) throw new Error('A remote core connection needs a host parameter!');
  }

  public internalSendRequest(payload: ICoreRequestPayload): Promise<void> {
    return new Promise((resolve, reject) =>
      this.jsonSocket.sendMessage(payload, err => {
        if (err) reject(err);
        else resolve();
      }),
    );
  }

  public async disconnect(): Promise<void> {
    if (this.netSocket && !this.netSocket.destroyed) {
      await super.disconnect();
      await new Promise<void>(resolve => {
        this.netSocket.end(() => process.nextTick(resolve));
      });
    }
    this.netSocket = null;
    this.netConnectPromise = null;
  }

  public connect(): Promise<Error | null> {
    if (!this.netConnectPromise) {
      this.netConnectPromise = this.netConnect().catch(err => err);
    }

    return this.netConnectPromise;
  }

  public isRemoteConnection(): boolean {
    return false;
  }

  private async netConnect(): Promise<void> {
    let host = this.options.host;
    if (!host.includes('://')) {
      host = `tcp://${host}`;
    }
    const parsedUrl = new URL(host);
    const connect = { host: parsedUrl.hostname, port: parseInt(parsedUrl.port, 10) };
    this.netSocket = Net.connect(connect);
    await new Promise<void>(resolve => this.netSocket.once('connect', resolve));

    this.netSocket.once('close', this.disconnect.bind(this));
    this.jsonSocket = new JsonSocket(this.netSocket);
    this.jsonSocket.on('message', payload => this.onMessage(payload));
    await super.connect();
  }
}
