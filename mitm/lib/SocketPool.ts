import Queue from '@secret-agent/commons/Queue';
import Log from '@secret-agent/commons/Logger';
import { IBoundLog } from '@secret-agent/core-interfaces/ILog';
import MitmSocket from '@secret-agent/mitm-socket';
import Resolvable from '@secret-agent/commons/Resolvable';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import { ClientHttp2Session } from 'http2';
import RequestSession from '../handlers/RequestSession';

const { log } = Log(module);

export default class SocketPool {
  public alpn: string;
  public isClosing = false;
  private all = new Set<MitmSocket>();
  private pool = new Set<MitmSocket>();
  private free: MitmSocket[] = [];
  private pending: Resolvable<void>[] = [];
  private readonly http2Sessions: IHttp2Session[] = [];
  private queue: Queue;
  private logger: IBoundLog;

  constructor(readonly origin: string, readonly maxConnections, readonly session: RequestSession) {
    this.origin = origin;
    this.logger = log.createChild(module, { sessionId: session.sessionId, origin });
    this.queue = new Queue('SOCKET TO ORIGIN');
  }

  public freeSocket(socket: MitmSocket): void {
    this.free.push(socket);
    const pending = this.pending.shift();
    if (pending) {
      pending.resolve();
    }
  }

  public getSocket(
    options: { isWebsocket: boolean },
    createSocket: () => Promise<MitmSocket>,
  ): Promise<MitmSocket> {
    return this.queue.run(async () => {
      const http2Session = this.getHttp2Session();
      if (http2Session && !options.isWebsocket) {
        return Promise.resolve(http2Session.mitmSocket);
      }

      if (this.pool.size >= this.maxConnections && (this.pending.length || !this.free.length)) {
        const pending = new Resolvable<void>();
        this.pending.push(pending);
        await pending.promise;
      }

      if (this.free.length) {
        return this.free.shift();
      }

      const mitmSocket = await createSocket();
      mitmSocket.on('close', this.onSocketClosed.bind(this, mitmSocket));
      this.alpn = mitmSocket.alpn;

      this.all.add(mitmSocket);

      // don't put connections that can't be reused into the pool
      if (!mitmSocket.isHttp2() && !options.isWebsocket) {
        this.pool.add(mitmSocket);
      }

      return mitmSocket;
    });
  }

  public close(): void {
    for (const pending of this.pending) {
      pending.reject(new CanceledPromiseError('Shutting down socket pool'));
    }
    for (const session of this.http2Sessions) {
      try {
        session.mitmSocket.close();
        session.client.destroy();
        session.client.unref();
      } catch (err) {
        // don't need to log closing sessions
      }
    }
    this.http2Sessions.length = 0;
    for (const socket of this.all) {
      socket.close();
    }
    this.all.clear();
    this.pool.clear();
  }

  public getHttp2Session(): IHttp2Session | undefined {
    return this.http2Sessions[0];
  }

  public registerHttp2Session(client: ClientHttp2Session, mitmSocket: MitmSocket): void {
    if (this.http2Sessions.some(x => x.client === client)) return;

    const entry = { mitmSocket, client };
    this.http2Sessions.push(entry);
    client.on('close', () => this.closeHttp2Session(entry));
    client.on('goaway', () => this.closeHttp2Session(entry));
  }

  private onSocketClosed(socket: MitmSocket): void {
    this.pool.delete(socket);

    this.logger.stats('Socket closed');
    this.session.emit('socket-close', { socket });

    this.pool.delete(socket);

    const freeIdx = this.free.indexOf(socket);
    if (freeIdx >= 0) this.free.splice(freeIdx, 1);

    if (this.session.isClosing || socket.isWebsocket) return;

    if (this.pool.size < this.maxConnections) this.pending.shift()?.resolve();
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
}
