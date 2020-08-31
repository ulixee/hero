import { ChildProcess, spawn } from 'child_process';
import * as net from 'net';
import { promises as fs, unlink } from 'fs';
import Log from '@secret-agent/commons/Logger';
import { EventEmitter } from 'events';
import { createPromise } from '@secret-agent/commons/utils';
import * as os from 'os';
import { v1 as uuid } from 'uuid';

const { log } = Log(module);

const ext = os.platform() === 'win32' ? '.exe' : '';
const libPath = `${__dirname}/dist/connect${ext}`;

export default class MitmSocket {
  public readonly socketPath: string;
  public alpn = 'http/1.1';
  public socket: net.Socket;
  public remoteAddress: string;
  public localAddress: string;

  private isClosing = false;
  private isConnected = false;
  private child: ChildProcess;
  private emitter = new EventEmitter();

  constructor(readonly sessionId: string, readonly connectOpts: IGoTlsSocketConnectOpts) {
    const id = uuid();
    this.socketPath =
      os.platform() === 'win32' ? `\\\\.\\pipe\\sa-${id}` : `${os.tmpdir()}/sa-${id}.sock`;

    if (connectOpts.debug === undefined) connectOpts.debug = log.level === 'stats';
    if (connectOpts.isSsl === undefined) connectOpts.isSsl = true;
  }

  public isReusable() {
    if (!this.socket || this.isClosing || !this.isConnected) return false;
    return this.socket.writable && !this.socket.destroyed;
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
    if (this.isClosing) return;
    this.isClosing = true;
    this.emitter.emit('close');
    this.cleanupSocket();
    this.closeChild();
  }

  public onListening() {
    const socket = net.connect(this.socketPath);
    this.socket = socket;
    socket.on('error', error => {
      log.error('SocketConnectDriver.SocketError', {
        sessionId: this.sessionId,
        error,
        socketPath: this.socketPath,
        host: this.connectOpts?.host,
        clientHello: this.connectOpts?.clientHelloId,
      });
      if ((error as any)?.code === 'ENOENT') this.close();
      this.isConnected = false;
    });
    socket.on('end', this.onSocketClose.bind(this, 'end'));
    socket.on('close', this.onSocketClose.bind(this, 'close'));
  }

  public async connect() {
    await this.cleanSocketPathIfNeeded();
    const child = spawn(libPath, [this.socketPath, JSON.stringify(this.connectOpts)], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    this.child = child;
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    const promise = createPromise(30e3);
    child.on('exit', code => {
      promise.reject(new Error(`Socket process exited during connect "${code}"`));
      this.cleanupSocket();
    });

    child.on('error', error => {
      promise.reject(error);
      log.error('SocketConnectDriver.ChildConnectError', {
        sessionId: this.sessionId,
        error,
        host: this.connectOpts?.host,
        clientHello: this.connectOpts?.clientHelloId,
      });
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
    if (this.child.killed) return;
    try {
      // fix for node 13 throwing errors on closed sockets
      this.child.stdin.on('error', () => {
        // catch
      });
      this.child.stdin.write('disconnect', () => {
        // don't log
      });
    } catch (err) {
      // don't log epipes
    }
    if (os.platform() !== 'win32') {
      this.child.kill();
    }
    this.child.unref();
  }

  private cleanupSocket() {
    if (!this.socket) return;
    this.socket.end();
    this.isConnected = false;
    unlink(this.socketPath, () => null);
    delete this.socket;
  }

  private onSocketClose() {
    this.close();
  }

  private onChildProcessMessage(messages: string) {
    for (const message of messages.split(/\r?\n/)) {
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
        log.stats('SocketHandler.Connected', {
          sessionId: this.sessionId,
          alpn: this.alpn,
          host: this.connectOpts?.host,
          clientHello: this.connectOpts?.clientHelloId,
        });
      } else if (message) {
        log.info('SocketHandler.onData', {
          sessionId: this.sessionId,
          message,
          host: this.connectOpts?.host,
          clientHello: this.connectOpts?.clientHelloId,
        });
      }
    }
  }

  private onChildProcessStderr(message: string) {
    log.warn(`SocketConnectDriver.Error => ${message}`, { sessionId: this.sessionId });
    if (
      message.includes('panic: runtime error:') ||
      message.includes('tlsConn.Handshake error') ||
      message.includes('connection refused')
    ) {
      this.socket?.destroy(new Error(message));
      this.close();
    }
    if (message.includes('DomainSocket -> EOF') && !this.connectOpts.keepAlive) {
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
