import MitmSocket from '@secret-agent/mitm-socket';
import RequestSession from '../handlers/RequestSession';
import http2, { ClientHttp2Session, IncomingHttpHeaders, IncomingHttpStatusHeader } from 'http2';
import Log from '@secret-agent/commons/Logger';
import https, { RequestOptions } from 'https';
import http from 'http';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import { URL } from 'url';
import { createPromise, IResolvablePromise } from '@secret-agent/commons/utils';
import MitmRequestContext from './MitmRequestContext';
import IHttpOrH2Response from '../interfaces/IHttpOrH2Response';
import Queue from '@secret-agent/commons/Queue';

const { log } = Log(module);

export default class MitmRequestAgent {
  public static defaultMaxConnectionsPerOrigin = 6;
  private readonly session: RequestSession;
  private readonly maxConnectionsPerOrigin: number;

  private readonly http2Sessions: IHttp2Session[] = [];
  private readonly sockets = new Set<MitmSocket>();
  private readonly socketPoolByOrigin: { [origin: string]: ISocketPool } = {};

  constructor(session: RequestSession) {
    this.session = session;
    this.maxConnectionsPerOrigin =
      session.delegate?.maxConnectionsPerOrigin ?? MitmRequestAgent.defaultMaxConnectionsPerOrigin;
  }

  public async request(ctx: IMitmRequestContext, responseCallback: (res: any) => any) {
    const requestSettings = ctx.proxyToServerRequestSettings;

    if (process.env.MITM_ALLOW_INSECURE === 'true') {
      (requestSettings as any).rejectUnauthorized = false;
    }

    let mitmSocket = await this.getAvailableSocket(
      ctx.origin,
      ctx.isSSL,
      ctx.isUpgrade,
      requestSettings,
    );
    if (!mitmSocket) {
      mitmSocket = await this.waitForFreeSocket(ctx.origin);
    }
    MitmRequestContext.assignMitmSocket(ctx, mitmSocket);

    requestSettings.createConnection = () => mitmSocket.socket;
    requestSettings.agent = null;

    if (ctx.isHttp2) {
      return this.http2Request(requestSettings, mitmSocket, new URL(ctx.url), responseCallback);
    }

    const httpModule = ctx.isSSL ? https : http;
    return httpModule.request(requestSettings, responseCallback);
  }

  public async freeSocket(ctx: IMitmRequestContext) {
    if (ctx.isUpgrade || ctx.isHttp2 || this.session.isClosing) {
      return;
    }

    const pool = this.getSocketPoolByOrigin(ctx.origin);

    const socket = ctx.proxyToServerSocket;
    if (!socket.isReusable()) {
      return socket.close();
    }

    const pending = pool.pending.shift();
    if (pending) {
      pending.resolve(socket);
    } else {
      pool.free.push(socket);
    }
  }

  public async close() {
    while (this.http2Sessions.length) {
      const session = this.http2Sessions.shift();
      await new Promise(resolve => session.client.close(() => resolve()));
    }

    const socketConnects = [...this.sockets];
    this.sockets.clear();
    while (socketConnects.length) {
      const socket = socketConnects.shift();
      await socket.close();
    }
  }

  private async createSocketConnection(
    origin: string,
    isSsl: boolean,
    isUpgrade: boolean,
    options: RequestOptions,
  ) {
    const session = this.session;
    const tlsProfileId = session.delegate.tlsProfileId;
    const isKeepAlive = ((options.headers.connection ??
      options.headers.Connection) as string)?.match(/keep-alive/i);

    const mitmSocket = new MitmSocket(session.sessionId, {
      host: options.host,
      port: String(options.port),
      isSsl,
      servername: options.servername || options.host,
      rejectUnauthorized: options.rejectUnauthorized,
      clientHelloId: tlsProfileId,
      keepAlive: !!isKeepAlive,
    });

    const tcpVars = session.delegate.tcpVars;
    if (tcpVars) mitmSocket.setTcpSettings(tcpVars);

    const proxyUrl = await session.getUpstreamProxyUrl();
    if (proxyUrl) mitmSocket.setProxy(proxyUrl);

    await mitmSocket.connect();

    mitmSocket.on(
      'close',
      this.onSocketClosed.bind(this, mitmSocket, origin, isSsl, isUpgrade, options),
    );

    if (isUpgrade) {
      mitmSocket.socket.setNoDelay(true);
      mitmSocket.socket.setTimeout(0);
    }
    return mitmSocket;
  }

  ///////////////// Socket Connection Management ///////////////////////////////////////////////////

  private waitForFreeSocket(origin: string): Promise<MitmSocket> {
    const socketPool = this.getSocketPoolByOrigin(origin);
    const pending = createPromise<MitmSocket>();
    socketPool.pending.push(pending);
    return pending.promise;
  }

  private getSocketPoolByOrigin(origin: string) {
    if (!this.socketPoolByOrigin[origin]) {
      this.socketPoolByOrigin[origin] = {
        alpn: null,
        queue: new Queue(),
        pending: [],
        all: new Set<MitmSocket>(),
        free: [],
      };
    }

    return this.socketPoolByOrigin[origin];
  }

  private async onSocketClosed(
    socketConnect: MitmSocket,
    origin: string,
    isSsl: boolean,
    isUpgrade: boolean,
    options: RequestOptions,
  ) {
    this.sockets.delete(socketConnect);

    log.stats('Socket closed', {
      sessionId: this.session.sessionId,
      origin,
    });

    const pool = this.getSocketPoolByOrigin(origin);

    pool.all.delete(socketConnect);

    const freeIdx = pool.free.indexOf(socketConnect);
    if (freeIdx >= 0) pool.free.splice(freeIdx, 1);

    if (this.session.isClosing || isUpgrade) return;

    // if nothing pending, return
    if (!pool.pending.length) return;

    // safe to create one since we are short
    const socket = await this.getAvailableSocket(origin, isSsl, isUpgrade, options);
    if (!socket) return;

    const pending = pool.pending.shift();

    if (pending) {
      pending.resolve(socket);
    } else {
      pool.free.push(socket);
    }
  }

  private getAvailableSocket(
    origin: string,
    isSsl: boolean,
    isUpgrade: boolean,
    options: RequestOptions,
  ) {
    const pool = this.getSocketPoolByOrigin(origin);
    return pool.queue.run(async () => {
      const http2Session = this.getHttp2Session(origin);
      if (http2Session && !isUpgrade) {
        return Promise.resolve(http2Session.mitmSocket);
      }

      if (pool.free.length) return pool.free.shift();

      if (pool.all.size >= this.maxConnectionsPerOrigin) {
        return null;
      }

      const mitmSocket = await this.createSocketConnection(origin, isSsl, isUpgrade, options);
      pool.alpn = mitmSocket.alpn;

      this.sockets.add(mitmSocket);

      // don't put connections that can't be reused into the pool
      if (!mitmSocket.isHttp2() && !isUpgrade) {
        pool.all.add(mitmSocket);
      }

      return mitmSocket;
    });
  }

  ///////////////// Http2 helpers //////////////////////////////////////////////////////////////////

  private http2Request(
    requestSettings: https.RequestOptions,
    connectResult: MitmSocket,
    url: URL,
    responseHandler: (response: IHttpOrH2Response) => any,
  ) {
    const client = this.createHttp2Session(url.origin, connectResult);
    const h2Headers = MitmRequestAgent.convertOutboundHttp2Headers(url, requestSettings);
    const http2Stream = client.request(h2Headers);

    http2Stream.once('response', (headers, flags) => {
      const response = MitmRequestAgent.convertHttp2Response(http2Stream, headers);
      responseHandler(response);
    });
    return http2Stream;
  }

  private getHttp2Session(origin: string) {
    return this.http2Sessions.find(x => {
      if (x.origin === origin) return true;
      return x.client.originSet?.includes(origin);
    });
  }

  private createHttp2Session(origin: string, mitmSocket: MitmSocket) {
    const existing = this.getHttp2Session(origin);
    if (existing) return existing.client;

    const client = http2.connect(origin, {
      createConnection: () => mitmSocket.socket,
    });

    client.on('remoteSettings', settings => {
      log.info('Http2Client.remoteSettings', {
        sessionId: this.session.sessionId,
        settings,
      });
    });

    client.on('frameError', (frameType: number, errorCode: number) => {
      log.warn('Http2Client.frameError', {
        sessionId: this.session.sessionId,
        frameType,
        errorCode,
      });
    });

    client.on('goaway', args => {
      log.info('Http2.goaway', {
        sessionId: this.session.sessionId,
        args,
      });
      this.closeHttp2Session(client);
    });

    client.on('close', () => {
      log.info('Http2.close', {
        sessionId: this.session.sessionId,
      });
      this.closeHttp2Session(client);
    });

    this.http2Sessions.push({
      origin,
      client,
      mitmSocket,
    });

    return client;
  }

  private closeHttp2Session(client: ClientHttp2Session) {
    const index = this.http2Sessions.findIndex(x => client);
    if (index < 0) return;

    const [session] = this.http2Sessions.splice(index, 1);
    client.close();
    session.mitmSocket.close();
  }

  private static convertOutboundHttp2Headers(url: URL, requestSettings: https.RequestOptions) {
    const h2Headers = requestSettings.headers as http2.OutgoingHttpHeaders;
    h2Headers[':authority'] = requestSettings.headers.host ?? requestSettings.headers.Host;
    h2Headers[':path'] = url.pathname + url.search;
    h2Headers[':method'] = requestSettings.method;
    h2Headers[':scheme'] = 'https';
    for (const key of Object.keys(h2Headers)) {
      if (key.match(/connection/i) || key.match(/host/i)) {
        delete h2Headers[key];
      }
    }
    return h2Headers;
  }

  private static convertHttp2Response(
    http2Stream: http2.ClientHttp2Stream,
    headers: IncomingHttpHeaders & IncomingHttpStatusHeader,
  ) {
    const response = (http2Stream as unknown) as Partial<IHttpOrH2Response>;
    response.headers = {};
    response.rawHeaders = [];
    for (const key of Object.keys(headers)) {
      if (key[0] === ':') continue;
      response.headers[key] = headers[key];
      let value = headers[key];
      if (!Array.isArray(value)) value = [value];
      for (const val of value) {
        response.rawHeaders.push(key, val);
      }
    }
    response.method = headers[':method'];
    response.statusCode = headers[':status'];

    return response as IHttpOrH2Response;
  }
}

interface ISocketPool {
  alpn: string;
  queue: Queue;
  all: Set<MitmSocket>;
  free: MitmSocket[]; // array for fifo
  pending: IResolvablePromise<MitmSocket>[];
}

interface IHttp2Session {
  origin: string;
  client: ClientHttp2Session;
  mitmSocket: MitmSocket;
}
