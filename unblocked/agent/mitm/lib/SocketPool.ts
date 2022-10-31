import Queue from '@ulixee/commons/lib/Queue';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import MitmSocket from '@unblocked-web/agent-mitm-socket';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import { ClientHttp2Session } from 'http2';
import RequestSession from '../handlers/RequestSession';
import Http2SessionBinding from './Http2SessionBinding';

export default class SocketPool {
  public alpn: string;
  public isClosing = false;
  private readonly events = new EventSubscriber();
  private all = new Set<MitmSocket>();
  private pooled = 0;
  private free = new Set<MitmSocket>();
  private pending: Resolvable<void>[] = [];
  private readonly http2Sessions: IHttp2Session[] = [];
  private queue: Queue;
  private logger: IBoundLog;

  constructor(origin: string, readonly maxConnections, readonly session: RequestSession) {
    this.logger = session.logger.createChild(module, { origin });
    this.queue = new Queue('SOCKET TO ORIGIN');
  }

  public freeSocket(socket: MitmSocket): void {
    this.free.add(socket);
    const pending = this.pending.shift();
    if (pending) {
      pending.resolve();
    }
  }

  public async isHttp2(
    isWebsocket: boolean,
    createSocket: () => Promise<MitmSocket>,
  ): Promise<boolean> {
    if (this.alpn) return this.alpn === 'h2';
    if (this.queue.isActive) {
      // eslint-disable-next-line require-await
      const alpn = await this.queue.run(() => Promise.resolve(this.alpn));
      if (alpn) return alpn === 'h2';
    }
    try {
      const socket = await this.getSocket(isWebsocket, createSocket);
      this.freeSocket(socket);
      return socket.isHttp2();
    } catch (err) {
      if (this.session.isClosing) return false;
      throw err;
    }
  }

  public getSocket(
    isWebsocket: boolean,
    createSocket: () => Promise<MitmSocket>,
  ): Promise<MitmSocket> {
    return this.queue.run(async () => {
      const http2Session = this.getHttp2Session();
      if (http2Session && !isWebsocket) {
        return Promise.resolve(http2Session.mitmSocket);
      }

      if (this.pooled >= this.maxConnections && (this.pending.length || this.free.size === 0)) {
        const pending = new Resolvable<void>();
        this.pending.push(pending);
        await pending.promise;
      }

      if (this.free.size) {
        const first = this.free.values().next().value;
        this.free.delete(first);
        if (first) return first;
      }

      const mitmSocket = await createSocket();
      this.events.on(mitmSocket, 'close', this.onSocketClosed.bind(this, mitmSocket));
      this.alpn = mitmSocket.alpn;

      this.all.add(mitmSocket);

      // don't put connections that can't be reused into the pool
      if (!mitmSocket.isHttp2() && !isWebsocket) {
        this.pooled += 1;
      }

      return mitmSocket;
    });
  }

  public close(): void {
    this.queue.willStop();
    for (const pending of this.pending) {
      pending.reject(new CanceledPromiseError('Shutting down socket pool'));
    }
    this.pending.length = 0;
    for (const session of this.http2Sessions) {
      try {
        session.mitmSocket.close();
        session.client.destroy();
        session.client.unref();
        session.binding.events.close();
        if (!session.client.socket.destroyed) session.client.socket.destroy();
        session.client.close();
      } catch (err) {
        // don't need to log closing sessions
      }
    }
    this.http2Sessions.length = 0;
    for (const socket of this.all) {
      socket.close();
    }
    this.events.close();
    this.all.clear();
    this.free.clear();
    this.queue.stop(new CanceledPromiseError('Shutting down socket pool'));
  }

  public getHttp2Session(): IHttp2Session | undefined {
    return this.http2Sessions[0];
  }

  public registerHttp2Session(
    client: ClientHttp2Session,
    mitmSocket: MitmSocket,
    binding: Http2SessionBinding,
  ): void {
    if (this.http2Sessions.some(x => x.client === client)) return;

    const entry = { mitmSocket, client, binding };
    this.http2Sessions.push(entry);
    this.events.on(client, 'close', () => this.closeHttp2Session(entry));
    this.events.on(mitmSocket, 'close', () => this.closeHttp2Session(entry));
    this.events.on(client, 'goaway', () => this.closeHttp2Session(entry));
  }

  private onSocketClosed(socket: MitmSocket): void {
    this.logger.stats('Socket closed');
    this.session.emit('socket-close', { socket });

    this.free.delete(socket);
    if (this.all.delete(socket)) {
      this.pooled -= 1;
    }

    if (this.session.isClosing || socket.isWebsocket || socket.isHttp2()) return;

    if (this.pooled < this.maxConnections) this.pending.shift()?.resolve();
  }

  private closeHttp2Session(session: IHttp2Session): void {
    const idx = this.http2Sessions.indexOf(session);
    if (idx >= 0) this.http2Sessions.splice(idx, 1);
    const { mitmSocket, client } = session;
    client.close();
    mitmSocket.close();
  }
}

interface IHttp2Session {
  client: ClientHttp2Session;
  mitmSocket: MitmSocket;
  binding: Http2SessionBinding;
}
