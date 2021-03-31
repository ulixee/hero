// eslint-disable-next-line max-classes-per-file
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
  public isReused = false;

  public get pid(): number | undefined {
    return this.child?.pid;
  }

  private isClosing = false;
  private isConnected = false;
  private child: ChildProcess;
  private connectError?: string;
  private readonly callStack: string;

  constructor(readonly sessionId: string, readonly connectOpts: IGoTlsSocketConnectOpts) {
    super();
    const id = uuid();
    this.callStack = new Error().stack.replace('Error:', '').trim();
    this.serverName = connectOpts.servername;
    this.socketPath =
      os.platform() === 'win32' ? `\\\\.\\pipe\\sa-${id}` : `${os.tmpdir()}/sa-${id}.sock`;
    this.logger = log.createChild(module, { sessionId });
    if (connectOpts.debug === undefined) connectOpts.debug = log.level === 'stats';
    if (connectOpts.isSsl === undefined) connectOpts.isSsl = true;
  }

  public isReusable(): boolean {
    if (!this.socket || this.isClosing || !this.isConnected) return false;
    return this.socket.writable && !this.socket.destroyed;
  }

  public setProxyUrl(url: string): void {
    this.connectOpts.proxyUrl = url;
  }

  public setTcpSettings(tcpVars: { windowSize: number; ttl: number }): void {
    this.connectOpts.tcpTtl = tcpVars.ttl;
    this.connectOpts.tcpWindowSize = tcpVars.windowSize;
  }

  public isHttp2(): boolean {
    return this.alpn === 'h2';
  }

  public close(): void {
    if (this.isClosing) return;
    this.closeTime = new Date();
    this.isClosing = true;
    this.emit('close');
    this.cleanupSocket();
    this.closeChild();
  }

  public onListening(): void {
    const socket = net.connect(this.socketPath);
    this.socket = socket;
    socket.on('error', error => {
      this.logger.warn('SocketConnectDriver.SocketError', {
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

  public async connect(connectTimeoutMillis = 30e3): Promise<void> {
    await this.cleanSocketPathIfNeeded();
    const child = spawn(libPath, [this.socketPath, JSON.stringify(this.connectOpts)], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
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
      promise.reject(
        buildConnectError(
          this.connectError ?? `Socket process exited during connect`,
          this.callStack,
        ),
      );
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
    child.stderr.on('data', message => {
      this.onChildProcessStderr(message);
      if (!this.isConnected && this.connectError) {
        promise.reject(buildConnectError(this.connectError, this.callStack));
        this.close();
      }
    });
    await promise.promise;
  }

  private async cleanSocketPathIfNeeded(): Promise<void> {
    try {
      await fs.unlink(this.socketPath);
    } catch (err) {
      // no action
    }
  }

  private closeChild(): void {
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

  private cleanupSocket(): void {
    if (!this.socket) return;
    if (this.connectError)
      this.socket.destroy(buildConnectError(this.connectError, this.callStack));
    this.socket.end();
    this.socket.unref();
    this.isConnected = false;
    unlink(this.socketPath, () => null);
    delete this.socket;
  }

  private onSocketClose(): void {
    this.close();
  }

  private onChildProcessMessage(messages: string): void {
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

  private onChildProcessStderr(message: string): void {
    if (
      message.includes('panic: runtime error:') ||
      message.includes('tlsConn.Handshake error') ||
      message.includes('connection refused') ||
      message.includes('no such host') ||
      message.includes('Dial (proxy/remote)') ||
      message.includes('PROXY_ERR')
    ) {
      this.connectError = message.trim();
      if (this.connectError.includes('Error:')) {
        this.connectError = this.connectError.split('Error:').pop().trim();
      }

      if (this.isConnected) {
        this.close();
      }
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

class Socks5ProxyConnectError extends Error {}
class HttpProxyConnectError extends Error {}
class SocketConnectError extends Error {}

function buildConnectError(connectError = 'Error connecting to host', callStack: string): Error {
  let error: Error;
  if (connectError.includes('SOCKS5_PROXY_ERR')) {
    error = new Socks5ProxyConnectError(connectError.replace('SOCKS5_PROXY_ERR', '').trim());
  } else if (connectError.includes('HTTP_PROXY_ERR')) {
    error = new HttpProxyConnectError(connectError.replace('HTTP_PROXY_ERR', '').trim());
  } else {
    error = new SocketConnectError(connectError.trim());
  }

  error.stack += `\n${'------DIAL'.padEnd(50, '-')}\n    `;
  error.stack += callStack;
  return error;
}
