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

  public sendRequest(payload: ICoreRequestPayload): Promise<void> {
    return new Promise((resolve, reject) =>
      this.jsonSocket.sendMessage(payload, err => {
        if (err) reject(err);
        else resolve();
      }),
    );
  }

  public async close(): Promise<void> {
    if (!(this.netSocket?.destroyed ?? false)) {
      await new Promise<void>(resolve => {
        this.netSocket.end(() => process.nextTick(resolve));
      });
    }
    await super.close();
  }

  public connect(): Promise<Error | null> {
    if (!this.netConnectPromise) {
      this.netConnectPromise = this.netConnect();
    }

    return this.netConnectPromise.then(() => super.connect()).catch(err => err);
  }

  private async netConnect(): Promise<void> {
    let host = this.options.host;
    if (!host.includes('://')) {
      host = `tcp://${host}`;
    }
    const parsedUrl = new URL(host);
    const connect = { host: parsedUrl.hostname, port: parseInt(parsedUrl.port, 10) };
    this.netSocket = Net.connect(connect);
    await new Promise<void>(resolve => {
      this.netSocket.once('connect', () => {
        resolve();
      });
    });

    this.netSocket.once('close', this.close.bind(this));
    this.jsonSocket = new JsonSocket(this.netSocket);
    this.jsonSocket.on('message', payload => this.onMessage(payload));
  }
}
