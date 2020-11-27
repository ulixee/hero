import { ChildProcess, spawn } from 'child_process';
import * as net from 'net';
import { promises as fs, unlink } from 'fs';
import * as os from 'os';
import { v1 as uuid } from 'uuid';
import Log from '@secret-agent/commons/Logger';
import { createPromise } from '@secret-agent/commons/utils';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';

const { log } = Log(module);

const ext = os.platform() === 'win32' ? '.exe' : '';
const libPath = `${__dirname}/dist/connect${ext}`;

let idCounter = 0;

export default class MitmSocket extends TypedEventEmitter<{
  connect: void;
  dial: void;
  close: void;
}> {
  public readonly socketPath: string;
  public alpn = 'http/1.1';
  public socket: net.Socket;
  public remoteAddress: string;
  public localAddress: string;
  public serverName: string;

  public id = (idCounter += 1);

  public spawnTime: Date;
  public dialTime: Date;
  public connectTime: Date;
  public closeTime: Date;

  public get pid() {
    return this.child?.pid;
  }

  private isClosing = false;
  private isConnected = false;
  private child: ChildProcess;
  private connectError?: string;

  constructor(readonly sessionId: string, readonly connectOpts: IGoTlsSocketConnectOpts) {
    super();
    const id = uuid();
    this.serverName = connectOpts.servername;
    this.socketPath =
      os.platform() === 'win32' ? `\\\\.\\pipe\\sa-${id}` : `${os.tmpdir()}/sa-${id}.sock`;
    this.logger = log.createChild(module, { sessionId });
    if (connectOpts.debug === undefined) connectOpts.debug = log.level === 'stats';
    if (connectOpts.isSsl === undefined) connectOpts.isSsl = true;
  }

  public isReusable() {
    if (!this.socket || this.isClosing || !this.isConnected) return false;
    return this.socket.writable && !this.socket.destroyed;
  }

  public setProxy(url: string, auth?: string) {
    this.connectOpts.proxyUrl = url;
    this.connectOpts.proxyAuth = auth;
  }

  public setTcpSettings(tcpVars: { windowSize: number; ttl: number }) {
    this.connectOpts.tcpTtl = tcpVars.ttl;
    this.connectOpts.tcpWindowSize = tcpVars.windowSize;
  }

  public isHttp2() {
    return this.alpn === 'h2';
  }

  public close() {
    if (this.isClosing) return;
    this.closeTime = new Date();
    this.isClosing = true;
    this.emit('close');
    this.cleanupSocket();
    this.closeChild();
  }

  public onListening() {
    const socket = net.connect(this.socketPath);
    this.socket = socket;
    socket.on('error', error => {
      this.logger.error('SocketConnectDriver.SocketError', {
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

  public async connect(connectTimeoutMillis = 30e3) {
    await this.cleanSocketPathIfNeeded();
    const child = spawn(libPath, [this.socketPath, JSON.stringify(this.connectOpts)], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    this.spawnTime = new Date();
    this.child = child;
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    const promise = createPromise(
      connectTimeoutMillis,
      `Timeout connecting to ${this.serverName ?? 'host'} at ${this.connectOpts.host}:${
        this.connectOpts.port
      }`,
    );
    child.on('exit', () => {
      promise.reject(this.connectError ?? new Error(`Socket process exited during connect`));
      this.cleanupSocket();
    });

    child.on('error', error => {
      promise.reject(error);
      this.logger.error('SocketConnectDriver.ChildConnectError', {
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
    if (!this.child || this.child.killed) return;
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
    if (this.connectError) this.socket.destroy(new Error(this.connectError));
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
        this.dialTime = new Date();
        const matches = message.match(/Remote: (.+), Local: (.+)/);
        if (matches?.length) {
          this.remoteAddress = matches[1];
          this.localAddress = matches[2];
        }
        this.emit('dial');
      } else if (message === '[DomainSocketPiper.ReadyForConnect]') {
        this.onListening();
      } else if (message.startsWith('[DomainSocketPiper.Connected]')) {
        this.isConnected = true;
        this.connectTime = new Date();
        const matches = message.match(/ALPN: (.+)/);
        if (matches?.length) {
          this.alpn = matches[1];
        }
        this.emit('connect');
        this.logger.stats('SocketHandler.Connected', {
          alpn: this.alpn,
          host: this.connectOpts?.host,
          clientHello: this.connectOpts?.clientHelloId,
        });
      } else if (message) {
        this.logger.info('SocketHandler.onData', {
          message,
          host: this.connectOpts?.host,
          clientHello: this.connectOpts?.clientHelloId,
        });
      }
    }
  }

  private onChildProcessStderr(message: string) {
    if (
      message.includes('panic: runtime error:') ||
      message.includes('tlsConn.Handshake error') ||
      message.includes('connection refused') ||
      message.includes('no such host')
    ) {
      this.connectError = message.trim();
      this.close();
    } else if (message.includes('DomainSocket -> EOF') && !this.connectOpts.keepAlive) {
      this.close();
    } else {
      this.logger.warn(`SocketConnectDriver.Error => ${message}`);
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
  proxyAuth?: string;
  tcpTtl?: number;
  tcpWindowSize?: number;
  debug?: boolean;
  keepAlive?: boolean;
}
