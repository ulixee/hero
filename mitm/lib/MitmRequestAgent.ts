import MitmSocket from '@secret-agent/mitm-socket';
import http2, { ClientHttp2Session } from 'http2';
import Log from '@secret-agent/commons/Logger';
import https, { RequestOptions } from 'https';
import http from 'http';
import { createPromise, IResolvablePromise } from '@secret-agent/commons/utils';
import Queue from '@secret-agent/commons/Queue';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import MitmRequestContext from './MitmRequestContext';
import RequestSession from '../handlers/RequestSession';
import BlockHandler from '../handlers/BlockHandler';
import HeadersHandler from '../handlers/HeadersHandler';

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

  public async request(
    ctx: IMitmRequestContext,
    responseCallback: (res: NodeJS.ReadableStream) => any,
  ) {
    const url = ctx.url;
    const requestSettings: https.RequestOptions = {
      method: ctx.method,
      path: url.pathname + url.search,
      host: url.hostname,
      port: url.port || (ctx.isSSL ? 443 : 80),
      headers: ctx.requestHeaders,
      rejectUnauthorized: process.env.MITM_ALLOW_INSECURE !== 'true',
    };

    let mitmSocket = await this.getAvailableSocket(
      ctx.url.origin,
      ctx.isSSL,
      ctx.isUpgrade,
      requestSettings,
    );
    if (!mitmSocket) {
      mitmSocket = await this.waitForFreeSocket(ctx.url.origin);
    }
    MitmRequestContext.assignMitmSocket(ctx, mitmSocket);

    requestSettings.createConnection = () => mitmSocket.socket;
    requestSettings.agent = null;

    if (ctx.isServerHttp2) {
      HeadersHandler.prepareRequestHeadersForHttp2(ctx);
      return this.http2Request(ctx, mitmSocket, responseCallback);
    }

    return this.http1Request(ctx, requestSettings, responseCallback);
  }

  public async freeSocket(ctx: IMitmRequestContext) {
    if (ctx.isUpgrade || ctx.isServerHttp2 || this.session.isClosing) {
      return;
    }

    const pool = this.getSocketPoolByOrigin(ctx.url.origin);

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

  /////// ////////// Socket Connection Management ///////////////////////////////////////////////////

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

  private http1Request(
    ctx: IMitmRequestContext,
    requestSettings: http.RequestOptions,
    responseHandler: (response: NodeJS.ReadableStream) => any,
  ) {
    const httpModule = ctx.isSSL ? https : http;
    return httpModule.request(requestSettings, response => {
      MitmRequestContext.readHttp1Response(ctx, response);
      responseHandler(response);
    });
  }

  /////// ////////// Http2 helpers //////////////////////////////////////////////////////////////////

  private http2Request(
    ctx: IMitmRequestContext,
    connectResult: MitmSocket,
    responseHandler: (response: NodeJS.ReadableStream) => any,
  ) {
    const client = this.createHttp2Session(ctx, connectResult);
    const http2Stream = client.request(ctx.requestHeaders, { waitForTrailers: true });
    http2Stream.once('response', (headers) => {
      MitmRequestContext.readHttp2Response(ctx, headers);
      responseHandler(http2Stream);
    });
    http2Stream.on('push', this.onHttp2PushStream.bind(this, ctx, http2Stream));

    return http2Stream;
  }

  private onHttp2PushStream(
    parentContext: IMitmRequestContext,
    stream: http2.ClientHttp2Stream,
    headers: http2.IncomingHttpHeaders & http2.IncomingHttpStatusHeader,
    flags: number,
  ) {
    const session = this.session;
    const sessionId = session.sessionId;
    log.info('Http2Client.pushReceived', { sessionId, headers, flags });

    const pushContext = MitmRequestContext.createFromHttp2Push(parentContext, headers);
    this.session.trackResource(pushContext);
    this.session.emit('request', MitmRequestContext.toEmittedResource(pushContext));

    if (BlockHandler.shouldBlockRequest(pushContext)) {
      this.session.emit('response', MitmRequestContext.toEmittedResource(pushContext));
      return stream.close(http2.constants.NGHTTP2_CANCEL);
    }

    pushContext.serverToProxyResponseStream = stream;
    MitmRequestContext.readHttp2Response(pushContext, headers);

    // emit request
    if (!parentContext.isClientHttp2) {
      log.warn('Http2Client.pushReceivedWithNonH2BrowserClient', {
        sessionId,
        path: headers[':path'],
      });
      return stream.close(http2.constants.NGHTTP2_REFUSED_STREAM);
    }

    const clientToProxyRequest = parentContext.clientToProxyRequest as http2.Http2ServerRequest;

    clientToProxyRequest.stream.pushStream(headers, async (err, pushStream) => {
      if (err) {
        log.warn('Http2.PushStreamError', {
          sessionId,
          err,
        });
        return;
      }

      let trailers: http2.IncomingHttpHeaders;
      stream.once('trailers', trailerHeaders => {
        trailers = trailerHeaders;
      });

      pushStream.respond({ ':status': 200 }, { waitForTrailers: true });
      pushStream.on('wantTrailers', async () => {
        pushContext.responseTrailers = trailers;
        pushStream.sendTrailers(pushContext.responseTrailers ?? {});
      });
      const cache = pushContext.cacheHandler;
      cache.onHttp2PushStream();

      for await (const chunk of stream) {
        cache.onResponseData(chunk);
        pushStream.write(chunk);
      }
      if (cache.shouldServeCachedData) {
        pushStream.write(cache.cacheData);
      }

      pushStream.end();
      cache.onResponseEnd();

      await HeadersHandler.waitForResource(pushContext);
      parentContext.requestSession.emit(
        'response',
        MitmRequestContext.toEmittedResource(pushContext),
      );
    });
  }

  private getHttp2Session(origin: string) {
    return this.http2Sessions.find(x => {
      if (x.origin === origin) return true;
      return x.client.originSet?.includes(origin);
    });
  }

  private createHttp2Session(ctx: IMitmRequestContext, mitmSocket: MitmSocket) {
    const origin = ctx.url.origin;
    const existing = this.getHttp2Session(origin);
    if (existing) return existing.client;

    const proxyToServerH2Client = http2.connect(origin, {
      createConnection: () => mitmSocket.socket,
    });

    proxyToServerH2Client.on('stream', this.onHttp2PushStream.bind(this, ctx));

    proxyToServerH2Client.on('remoteSettings', settings => {
      log.info('Http2Client.remoteSettings', {
        sessionId: this.session.sessionId,
        origin,
        settings,
      });
    });

    proxyToServerH2Client.on('frameError', (frameType: number, errorCode: number) => {
      log.warn('Http2Client.frameError', {
        sessionId: this.session.sessionId,
        origin,
        frameType,
        errorCode,
      });
    });

    proxyToServerH2Client.on('goaway', args => {
      log.info('Http2.goaway', {
        sessionId: this.session.sessionId,
        origin,
        args,
      });
      this.closeHttp2Session(proxyToServerH2Client);
    });

    proxyToServerH2Client.on('altsvc', (alt, altOrigin) => {
      log.warn('Http2.altsvc', {
        sessionId: this.session.sessionId,
        origin,
        altOrigin,
        alt,
      });
    });

    proxyToServerH2Client.on('origin', origins => {
      log.warn('Http2.origin', {
        sessionId: this.session.sessionId,
        origin,
        origins,
      });
    });

    proxyToServerH2Client.on('close', () => {
      log.info('Http2.close', {
        sessionId: this.session.sessionId,
        origin,
      });
      this.closeHttp2Session(proxyToServerH2Client);
    });

    this.http2Sessions.push({
      origin,
      client: proxyToServerH2Client,
      mitmSocket,
    });

    return proxyToServerH2Client;
  }

  private closeHttp2Session(client: ClientHttp2Session) {
    const index = this.http2Sessions.findIndex(x => x.client === client);
    if (index < 0) return;

    const [session] = this.http2Sessions.splice(index, 1);
    client.close();
    session.mitmSocket.close();
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
