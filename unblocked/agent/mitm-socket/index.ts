// eslint-disable-next-line max-classes-per-file
import * as net from 'net';
import { unlink } from 'fs';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import { createIpcSocketPath } from '@ulixee/commons/lib/IpcUtils';
import IHttpSocketWrapper from '@ulixee/unblocked-specification/agent/net/IHttpSocketWrapper';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import IHttpSocketConnectOptions from '@ulixee/unblocked-specification/agent/net/IHttpSocketConnectOptions';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import TimeoutError from '@ulixee/commons/interfaces/TimeoutError';
import MitmSocketSession from './lib/MitmSocketSession';

let idCounter = 0;

export default class MitmSocket
  extends TypedEventEmitter<{
    connect: void;
    dial: void;
    eof: void;
    close: void;
  }>
  implements IHttpSocketWrapper
{
  public get isWebsocket(): boolean {
    return this.connectOpts.isWebsocket === true;
  }

  public readonly socketPath: string;
  public alpn = 'http/1.1';
  public rawApplicationSettings: Buffer;
  public alps: {
    settings?: { id: number; value: number }[];
    acceptCh?: { domain: string; headers: string[] };
  };

  public socket: net.Socket;
  public dnsResolvedIp: string;
  public remoteAddress: string;
  public localAddress: string;
  public serverName: string;

  // eslint-disable-next-line no-multi-assign
  public id = (idCounter += 1);

  public createTime: Date;
  public dnsLookupTime: Date;
  public ipcConnectionTime: Date;
  public connectTime: Date;
  public errorTime: Date;
  public closeTime: Date;

  public isConnected = false;
  public isReused = false;
  public isClosing = false;
  public closedPromise = new Resolvable<Date>();
  public connectError?: string;
  public receivedEOF = false;

  protected logger: IBoundLog;

  private server: net.Server;
  private connectPromise: Resolvable<void>;
  private socketReadyPromise = new Resolvable<void>();
  private events = new EventSubscriber();
  private readonly callStack: string;

  constructor(
    readonly sessionId: string,
    logger: IBoundLog,
    readonly connectOpts: IHttpSocketConnectOptions,
  ) {
    super();
    this.callStack = new Error().stack.replace('Error:', '').trim();
    this.serverName = connectOpts.servername;
    this.logger = logger.createChild(module);
    this.connectOpts.isSsl ??= true;

    this.socketPath = createIpcSocketPath(`agent-${sessionId}-${this.id}`);

    // start listening
    this.server = new net.Server().unref();
    this.events.on(this.server, 'connection', this.onConnected.bind(this));
    this.events.on(this.server, 'error', error => {
      if (this.isClosing) return;
      this.logger.warn('IpcSocketServerError', { error });
    });

    unlink(this.socketPath, () => {
      this.server.listen(this.socketPath);
    });

    this.createTime = new Date();
    this.close = this.close.bind(this);
  }

  public isReusable(): boolean {
    if (!this.socket || this.isClosing || !this.isConnected) return false;
    return this.socket.writable && !this.socket.destroyed;
  }

  public setProxyUrl(url: string): void {
    this.connectOpts.proxyUrl = url;
  }

  public isHttp2(): boolean {
    return this.alpn === 'h2';
  }

  public close(): void {
    if (this.isClosing) return;

    const parentLogId = this.logger.info(`MitmSocket.Closing`);
    this.isClosing = true;
    this.closeTime = new Date();
    if (!this.connectPromise?.isResolved) {
      this.connectPromise?.reject(
        buildConnectError(
          this.connectError ?? `Failed to connect to ${this.serverName}`,
          this.callStack,
        ),
      );
    }
    this.emit('close');
    this.cleanupSocket();
    this.closedPromise.resolve(this.closeTime);
    this.events.close('error');
    this.removeAllListeners();
    this.logger.stats(`MitmSocket.Closed`, {
      parentLogId,
    });
  }

  public onConnected(socket: net.Socket): void {
    this.ipcConnectionTime = new Date();
    this.socket = socket;
    this.events.on(socket, 'error', error => {
      this.logger.warn('MitmSocket.SocketError', {
        sessionId: this.sessionId,
        error,
        socketPath: this.socketPath,
        host: this.connectOpts?.host,
      });
      if ((error as any)?.code === 'ENOENT') {
        this.errorTime = new Date();
        this.close();
      }
      this.isConnected = false;
    });
    this.events.on(socket, 'end', this.close);
    this.events.once(socket, 'close', this.close);
    this.socketReadyPromise.resolve();
  }

  public async connect(session: MitmSocketSession, connectTimeoutMillis = 30e3): Promise<void> {
    if (!this.server.listening) {
      await new Promise(resolve => this.events.once(this.server, 'listening', resolve));
    }
    if (session.isClosing || this.isClosing || !session) return;

    // minimum of 1 second
    if (connectTimeoutMillis < 1e3) connectTimeoutMillis = 1e3;

    this.connectPromise = new Resolvable<void>(
      connectTimeoutMillis,
      `Timeout connecting to ${this.serverName ?? 'host'} at ${this.connectOpts.host}:${
        this.connectOpts.port
      }`,
    );

    try {
      await Promise.all([
        session.requestSocket(this),
        this.connectPromise.promise,
        this.socketReadyPromise.promise,
      ]);
    } catch (error) {
      if (error instanceof TimeoutError && (session.isClosing || this.isClosing)) return;
      throw error;
    }
  }

  public onMessage(message: any): void {
    const status = message?.status;
    if (status === 'connected') {
      this.connectTime = new Date();
      this.isConnected = true;
      if (message.alpn) this.alpn = message.alpn;
      if (message.rawApplicationSettings) {
        // settings are http2 frames
        this.rawApplicationSettings = Buffer.from(message.rawApplicationSettings, 'base64');
        const acceptChFrame = message.alps?.AcceptChPayload
          ? Buffer.from(message.alps.AcceptChPayload, 'base64')
          : null;

        let acceptCh: this['alps']['acceptCh'];
        if (acceptChFrame) {
          const originLength = acceptChFrame.readUint16BE();
          const origin = acceptChFrame.subarray(2, originLength + 2).toString('utf8');
          const headerLength = acceptChFrame.readUint16BE(3 + originLength);
          const headers = acceptChFrame
            .subarray(originLength + 4, originLength + 4 + headerLength)
            .toString('utf8');
          acceptCh = { domain: origin, headers: headers.split(',').map(x => x.trim()) };
        }

        this.alps = {
          acceptCh,
          settings: message.alps?.Settings?.map(x => {
            return {
              id: x.id,
              value: x.Val,
            };
          }),
        };
      }
      this.remoteAddress = message.remoteAddress;
      this.localAddress = message.localAddress;
      this.emit('connect');
      this.connectPromise.resolve();
    } else if (status === 'error') {
      this.onError(message.error);
    } else if (status === 'eof') {
      this.receivedEOF = true;
      setImmediate(() => {
        if (this.isClosing) return;
        this.emit('eof');
      });
    } else if (status === 'closing') {
      setImmediate(this.close.bind(this));
    }
  }

  public onExit(): void {
    this.triggerConnectErrorIfNeeded(true);
    this.close();
  }

  private triggerConnectErrorIfNeeded(isExiting = false): void {
    if (this.connectPromise?.isResolved) return;
    if (isExiting && !this.connectError) {
      this.connectPromise.resolve();
      return;
    }
    this.connectPromise?.reject(
      buildConnectError(
        this.connectError ?? `Socket process exited during connect`,
        this.callStack,
      ),
    );
  }

  private onError(message: string): void {
    this.errorTime = new Date();
    this.logger.info('MitmSocket.error', { message, host: this.connectOpts.host });
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

      this.triggerConnectErrorIfNeeded(false);
    }
    this.close();
  }

  private cleanupSocket(): void {
    if (this.socket) {
      this.socket.unref();
      this.socket.destroy();
    }
    this.server.unref().close();
    this.server.removeAllListeners();
    this.isConnected = false;
    unlink(this.socketPath, () => null);
    delete this.socket;
  }
}

class Socks5ProxyConnectError extends Error {
  override name = 'Socks5ProxyConnectError';
}
class HttpProxyConnectError extends Error {
  override name = 'HttpProxyConnectError';
}
class SocketConnectError extends Error {
  override name = 'SocketConnectError';
}

function buildConnectError(connectError: string, callStack: string): Error {
  let error: Error;
  connectError ??= 'Error connecting to host';
  if (connectError.includes('SOCKS5_PROXY_ERR')) {
    error = new Socks5ProxyConnectError(
      connectError.replace('SOCKS5_PROXY_ERR', 'Socks5 Proxy Connect Error').trim(),
    );
  } else if (connectError.includes('HTTP_PROXY_ERR')) {
    error = new HttpProxyConnectError(
      connectError.replace('HTTP_PROXY_ERR', 'Http Proxy Connect Error').trim(),
    );
  } else {
    error = new SocketConnectError(connectError.trim());
  }

  error.stack += `\n${'------DIAL'.padEnd(50, '-')}\n    `;
  error.stack += callStack;
  return error;
}
