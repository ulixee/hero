import { ChildProcess, spawn } from 'child_process';
import * as net from 'net';
import { promises as fs, unlink } from 'fs';
import Log from '@secret-agent/commons/Logger';
import { EventEmitter } from 'events';
import { createPromise } from '@secret-agent/commons/utils';
import * as os from 'os';

const { log } = Log(module);

let counter = 0;
export default class SocketConnectDriver {
  public readonly socketPath: string;
  public alpn = 'http/1.1';
  public socket: net.Socket;
  public remoteAddress: string;
  public localAddress: string;

  private isConnected = false;
  private child: ChildProcess;
  private emitter = new EventEmitter();

  constructor(readonly connectOpts: IGoTlsSocketConnectOpts) {
    this.socketPath = `/tmp/sa-mitm-${(counter += 1)}.sock`;
    if (connectOpts.isSsl === undefined) connectOpts.isSsl = true;
  }

  public setProxy(url: string, auth?: string) {
    this.connectOpts.proxyUrl = url;
    if (auth) {
      this.connectOpts.proxyAuthBase64 = Buffer.from(auth).toString('base64');
    }
  }

  public setTcpSettings(tcpVars: { windowSize: number; ttl: number }) {
    this.connectOpts.tcpTtl = tcpVars.ttl;
    this.connectOpts.tcpWindowSize = tcpVars.windowSize;
  }

  public on(event: 'close', listener: (socket: net.Socket) => any) {
    this.emitter.on(event, listener);
  }

  public isHttp2() {
    return this.alpn === 'h2';
  }

  public close() {
    this.emitter.emit('close');
    this.cleanupSocket();
    this.closeChild();
  }

  public onListening() {
    const socket = (this.socket = net.connect(this.socketPath));
    socket.on('error', err => log.error('SocketConnectDriver.SocketError', err));
    socket.on('end', this.onSocketClose.bind(this, 'end'));
    socket.on('close', this.onSocketClose.bind(this, 'close'));
  }

  public async connect() {
    await this.cleanSocketPathIfNeeded();
    const ext = os.platform() === 'win32' ? '.exe' : '';
    const child = (this.child = spawn(
      `${__dirname}/../socket/connect${ext}`,
      [this.socketPath, JSON.stringify(this.connectOpts)],
      {
        stdio: ['inherit', 'pipe', 'pipe'],
      },
    ));
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    const promise = createPromise(30e3);
    child.on('exit', code => {
      if (this.socket) this.socket.end();
      promise.reject();
    });

    child.on('error', err => {
      promise.reject(err);
      log.error('SocketConnectDriver.ChildConnectError', err);
      this.close();
    });

    child.stdout.on('data', message => {
      this.onChildProcessMessage(message);
      if (this.isConnected) {
        promise.resolve();
      }
    });
    // if error logs during connect window, we got a connect error
    child.stderr.on('data', this.onChildProcessStderr.bind(this));
    await promise.promise;
  }

  private async cleanSocketPathIfNeeded() {
    try {
      await fs.unlink(this.socketPath);
    } catch (err) {
      // no action
    }
  }

  private closeChild() {
    if (!this.child) return;
    this.child.kill('SIGINT');
    delete this.child;
  }

  private cleanupSocket() {
    if (!this.socket) return;
    unlink(this.socketPath, () => null);
    this.socket.removeAllListeners();
    delete this.socket;
  }

  private onSocketClose(event: string) {
    this.close();
  }

  private onChildProcessMessage(messages: string) {
    for (const message of messages.split('\n')) {
      if (message.startsWith('[DomainSocketPiper.Dialed]')) {
        const matches = message.match(/Remote: (.+), Local: (.+)/);
        if (matches?.length) {
          this.remoteAddress = matches[1];
          this.localAddress = matches[2];
        }
      } else if (message === '[DomainSocketPiper.ReadyForConnect]') {
        this.onListening();
      } else if (message.startsWith('[DomainSocketPiper.Connected]')) {
        this.isConnected = true;
        const matches = message.match(/ALPN: (.+)/);
        if (matches?.length) {
          this.alpn = matches[1];
        }
      } else {
        log.info('SocketHandler.onData', { message });
      }
    }
  }

  private onChildProcessStderr(message: string) {
    log.warn(`SocketConnectDriver.Error => ${message}`);
    if (
      message.includes('panic: runtime error:') ||
      message.includes('tlsConn.Handshake error') ||
      message.includes('connection refused')
    ) {
      this.socket?.destroy(new Error(message));
      this.close();
    }
  }
}

export interface IGoTlsSocketConnectOpts {
  host: string;
  port: string;
  isSsl?: boolean;
  clientHelloId: string;
  servername: string;
  rejectUnauthorized?: boolean;
  proxyUrl?: string;
  proxyAuthBase64?: string;
  tcpTtl?: number;
  tcpWindowSize?: number;
  debug?: boolean;
  keepAlive?: boolean;
}
