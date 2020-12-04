import MitmSocket from '@secret-agent/mitm-socket';
import http2, { ClientHttp2Session, ClientHttp2Stream, ServerHttp2Stream } from 'http2';
import Log from '@secret-agent/commons/Logger';
import https, { RequestOptions } from 'https';
import http from 'http';
import IResolvablePromise from '@secret-agent/core-interfaces/IResolvablePromise';
import { createPromise } from '@secret-agent/commons/utils';
import Queue from '@secret-agent/commons/Queue';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import MitmRequestContext from './MitmRequestContext';
import RequestSession from '../handlers/RequestSession';
import BlockHandler from '../handlers/BlockHandler';
import HeadersHandler from '../handlers/HeadersHandler';
import ResourceState from '../interfaces/ResourceState';

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
      session.networkInterceptorDelegate?.connections?.socketsPerOrigin ??
      MitmRequestAgent.defaultMaxConnectionsPerOrigin;
  }

  public async request(ctx: IMitmRequestContext) {
    const url = ctx.url;
    const requestSettings: https.RequestOptions = {
      method: ctx.method,
      path: url.pathname + url.search,
      host: url.hostname,
      port: url.port || (ctx.isSSL ? 443 : 80),
      headers: ctx.requestHeaders,
      rejectUnauthorized: process.env.MITM_ALLOW_INSECURE !== 'true',
    };

    ctx.setState(ResourceState.GetSocket);
    let mitmSocket = await this.getAvailableSocket(ctx, requestSettings);
    if (!mitmSocket) {
      mitmSocket = await this.waitForFreeSocket(ctx.url.origin);
    }
    MitmRequestContext.assignMitmSocket(ctx, mitmSocket);
    ctx.cacheHandler.onRequest();
    await HeadersHandler.modifyHeaders(ctx);

    requestSettings.headers = ctx.requestHeaders;
    requestSettings.createConnection = () => mitmSocket.socket;
    requestSettings.agent = null;

    if (ctx.isServerHttp2) {
      HeadersHandler.prepareRequestHeadersForHttp2(ctx);
      return this.http2Request(ctx, mitmSocket);
    }

    return this.http1Request(ctx, requestSettings);
  }

  public async freeSocket(ctx: IMitmRequestContext) {
    if (ctx.isUpgrade || ctx.isServerHttp2 || this.session.isClosing) {
      return;
    }

    const pool = this.getSocketPoolByOrigin(ctx.url.origin);

    const socket = ctx.proxyToServerMitmSocket;
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

  public close() {
    this.http2Sessions.map(x => x.client.destroy());
    this.http2Sessions.length = 0;
    for (const socket of this.sockets) {
      socket.close();
    }
    this.sockets.clear();
  }

  private async createSocketConnection(ctx: IMitmRequestContext, options: RequestOptions) {
    const session = this.session;
    const tlsProfileId = session.networkInterceptorDelegate.tls?.emulatorProfileId;
    const isKeepAlive = ((options.headers.connection ??
      options.headers.Connection) as string)?.match(/keep-alive/i);

    ctx.setState(ResourceState.LookupDns);
    const ipIfNeeded = await session.lookupDns(options.host);
    ctx.dnsResolvedIp = ipIfNeeded || 'Not Found';
    const mitmSocket = new MitmSocket(session.sessionId, {
      host: ipIfNeeded || options.host,
      port: String(options.port),
      isSsl: ctx.isSSL,
      servername: options.servername || options.host,
      rejectUnauthorized: options.rejectUnauthorized,
      clientHelloId: tlsProfileId,
      keepAlive: !!isKeepAlive,
    });
    mitmSocket.on('close', this.onSocketClosed.bind(this, mitmSocket, ctx, options));
    mitmSocket.on('connect', () => session.emit('socket-connect', { socket: mitmSocket }));

    const tcpVars = session.networkInterceptorDelegate.tcp;
    if (tcpVars) mitmSocket.setTcpSettings(tcpVars);

    if (session.upstreamProxyUrl) {
      ctx.setState(ResourceState.GetUpstreamProxyUrl);
      mitmSocket.setProxyUrl(session.upstreamProxyUrl);
    }

    ctx.setState(ResourceState.SocketConnect);
    await mitmSocket.connect(10e3);

    if (ctx.isUpgrade) {
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
    ctx: IMitmRequestContext,
    options: RequestOptions,
  ) {
    const origin = ctx.url.origin;
    this.sockets.delete(socketConnect);

    log.stats('Socket closed', {
      sessionId: this.session.sessionId,
      origin,
    });
    ctx.requestSession.emit('socket-close', { socket: socketConnect });
    const pool = this.getSocketPoolByOrigin(origin);

    pool.all.delete(socketConnect);

    const freeIdx = pool.free.indexOf(socketConnect);
    if (freeIdx >= 0) pool.free.splice(freeIdx, 1);

    if (this.session.isClosing || ctx.isUpgrade) return;

    // if nothing pending, return
    if (!pool.pending.length) return;

    // safe to create one since we are short
    const socket = await this.getAvailableSocket(ctx, options);
    if (!socket) return;

    const pending = pool.pending.shift();

    if (pending) {
      pending.resolve(socket);
    } else {
      pool.free.push(socket);
    }
  }

  private getAvailableSocket(ctx: IMitmRequestContext, options: RequestOptions) {
    const origin = ctx.url.origin;
    const isUpgrade = ctx.isUpgrade;

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

      const mitmSocket = await this.createSocketConnection(ctx, options);
      pool.alpn = mitmSocket.alpn;

      this.sockets.add(mitmSocket);

      // don't put connections that can't be reused into the pool
      if (!mitmSocket.isHttp2() && !isUpgrade) {
        pool.all.add(mitmSocket);
      }

      return mitmSocket;
    });
  }

  private http1Request(ctx: IMitmRequestContext, requestSettings: http.RequestOptions) {
    const httpModule = ctx.isSSL ? https : http;
    ctx.setState(ResourceState.CreateProxyToServerRequest);
    return httpModule.request(requestSettings);
  }

  /////// ////////// Http2 helpers //////////////////////////////////////////////////////////////////

  private http2Request(ctx: IMitmRequestContext, connectResult: MitmSocket) {
    const client = this.createHttp2Session(ctx, connectResult);
    ctx.setState(ResourceState.CreateProxyToServerRequest);
    return client.request(ctx.requestHeaders, { waitForTrailers: true });
  }

  private onHttp2ServerToProxyPush(
    parentContext: IMitmRequestContext,
    serverPushStream: http2.ClientHttp2Stream,
    headers: http2.IncomingHttpHeaders & http2.IncomingHttpStatusHeader,
    flags: number,
    rawHeaders: string[],
  ) {
    const session = this.session;
    const sessionId = session.sessionId;
    log.info('Http2Client.pushReceived', { sessionId, headers, flags });
    serverPushStream.on('error', error => {
      log.warn('Http2.ProxyToServer.PushStreamError', {
        sessionId,
        error,
      });
    });

    const pushContext = MitmRequestContext.createFromHttp2Push(parentContext, rawHeaders);
    this.session.trackResource(pushContext);
    pushContext.setState(ResourceState.ServerToProxyPush);
    this.session.emit('request', MitmRequestContext.toEmittedResource(pushContext));

    if (BlockHandler.shouldBlockRequest(pushContext)) {
      this.session.emit('response', MitmRequestContext.toEmittedResource(pushContext));
      pushContext.setState(ResourceState.Blocked);
      return serverPushStream.close(http2.constants.NGHTTP2_CANCEL);
    }

    pushContext.serverToProxyResponse = serverPushStream;

    // emit request
    if (!parentContext.isClientHttp2) {
      log.warn('Http2Client.pushReceivedWithNonH2BrowserClient', {
        sessionId,
        path: headers[':path'],
      });
      pushContext.setState(ResourceState.PrematurelyClosed);
      return serverPushStream.close(http2.constants.NGHTTP2_REFUSED_STREAM);
    }

    HeadersHandler.stripHttp1HeadersForHttp2(pushContext);
    const onResponseHeaders = new Promise<void>(resolve => {
      serverPushStream.once('push', (responseHeaders, responseFlags, responseRawHeaders) => {
        MitmRequestContext.readHttp2Response(
          pushContext,
          serverPushStream,
          responseHeaders[':status'],
          responseRawHeaders,
        );
        resolve();
      });
    });

    if (serverPushStream.destroyed) {
      pushContext.setState(ResourceState.PrematurelyClosed);
      return;
    }

    const clientToProxyRequest = parentContext.clientToProxyRequest as http2.Http2ServerRequest;
    pushContext.setState(ResourceState.ProxyToClientPush);
    clientToProxyRequest.stream.pushStream(
      pushContext.requestHeaders,
      this.handleHttp2ProxyToClientPush.bind(this, pushContext, onResponseHeaders),
    );
  }

  private async handleHttp2ProxyToClientPush(
    pushContext: IMitmRequestContext,
    onResponseHeaders: Promise<void>,
    error: Error,
    proxyToClientPushStream: ServerHttp2Stream,
  ) {
    pushContext.setState(ResourceState.ProxyToClientPushResponse);
    const serverToProxyPushStream = pushContext.serverToProxyResponse as ClientHttp2Stream;
    const cache = pushContext.cacheHandler;
    const session = this.session;
    const sessionId = session.sessionId;

    if (error) {
      log.warn('Http2.ClientToProxy.PushStreamError', {
        sessionId,
        error,
      });
      return;
    }
    proxyToClientPushStream.on('error', pushError => {
      log.warn('Http2.ClientToProxy.PushStreamError', {
        sessionId,
        error: pushError,
      });
    });

    serverToProxyPushStream.on('headers', additional => {
      if (!proxyToClientPushStream.destroyed) proxyToClientPushStream.additionalHeaders(additional);
    });

    let trailers: http2.IncomingHttpHeaders;
    serverToProxyPushStream.once('trailers', trailerHeaders => {
      trailers = trailerHeaders;
    });

    await onResponseHeaders;
    if (proxyToClientPushStream.destroyed || serverToProxyPushStream.destroyed) {
      return;
    }
    cache.onHttp2PushStream();

    if (cache.shouldServeCachedData) {
      if (!proxyToClientPushStream.destroyed) {
        proxyToClientPushStream.write(cache.cacheData);
      }
      if (!serverToProxyPushStream.destroyed) {
        serverToProxyPushStream.close(http2.constants.NGHTTP2_REFUSED_STREAM);
      }
    } else {
      proxyToClientPushStream.respond(pushContext.responseHeaders, { waitForTrailers: true });
      proxyToClientPushStream.on('wantTrailers', async () => {
        pushContext.responseTrailers = trailers;
        proxyToClientPushStream.sendTrailers(pushContext.responseTrailers ?? {});
      });

      pushContext.setState(ResourceState.ServerToProxyPushResponse);
      for await (const chunk of serverToProxyPushStream) {
        if (proxyToClientPushStream.destroyed || serverToProxyPushStream.destroyed) return;
        cache.onResponseData(chunk);
        proxyToClientPushStream.write(chunk);
      }
      if (!serverToProxyPushStream.destroyed) serverToProxyPushStream.end();
    }

    if (!proxyToClientPushStream.destroyed) proxyToClientPushStream.end();
    cache.onResponseEnd();

    await HeadersHandler.waitForBrowserRequest(pushContext);
    this.session.emit('response', MitmRequestContext.toEmittedResource(pushContext));
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

    ctx.setState(ResourceState.CreateH2Session);
    const proxyToServerH2Client = http2.connect(origin, {
      createConnection: () => mitmSocket.socket,
    });

    proxyToServerH2Client.on('stream', this.onHttp2ServerToProxyPush.bind(this, ctx));

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
