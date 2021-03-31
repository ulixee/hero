import MitmSocket from '@secret-agent/mitm-socket';
import * as http2 from 'http2';
import {
  ClientHttp2Session,
  ClientHttp2Stream,
  Http2ServerRequest,
  ServerHttp2Stream,
} from 'http2';
import Log, { hasBeenLoggedSymbol } from '@secret-agent/commons/Logger';
import * as https from 'https';
import { RequestOptions } from 'https';
import * as http from 'http';
import IResolvablePromise from '@secret-agent/core-interfaces/IResolvablePromise';
import { createPromise } from '@secret-agent/commons/utils';
import Queue from '@secret-agent/commons/Queue';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import MitmRequestContext from './MitmRequestContext';
import RequestSession from '../handlers/RequestSession';
import BlockHandler from '../handlers/BlockHandler';
import HeadersHandler from '../handlers/HeadersHandler';
import ResourceState from '../interfaces/ResourceState';

const { log } = Log(module);

// TODO: this is off by default because golang 1.14 has an issue verifying certain certificate authorities:
// https://github.com/golang/go/issues/24652
// https://github.com/golang/go/issues/38365
const allowUnverifiedCertificates = Boolean(JSON.parse(process.env.MITM_ALLOW_INSECURE ?? 'true'));

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

  public async request(
    ctx: IMitmRequestContext,
  ): Promise<http2.ClientHttp2Stream | http.ClientRequest> {
    const url = ctx.url;

    const requestSettings: https.RequestOptions = {
      method: ctx.method,
      path: url.pathname + url.search,
      host: url.hostname,
      port: url.port || (ctx.isSSL ? 443 : 80),
      headers: ctx.requestHeaders,
      rejectUnauthorized: allowUnverifiedCertificates === false,
    };

    await this.assignSocket(ctx, requestSettings);

    ctx.cacheHandler.onRequest();
    await HeadersHandler.modifyHeaders(ctx);

    requestSettings.headers = ctx.requestHeaders;

    if (ctx.isServerHttp2) {
      HeadersHandler.prepareRequestHeadersForHttp2(ctx);
      return this.http2Request(ctx);
    }

    return this.http1Request(ctx, requestSettings);
  }

  public freeSocket(ctx: IMitmRequestContext): void {
    if (ctx.isUpgrade || ctx.isServerHttp2 || this.session.isClosing) {
      return;
    }
    const connectionHeader = ctx.responseHeaders?.Connection ?? ctx.responseHeaders?.connection;
    const isCloseRequested = connectionHeader !== 'keep-alive';

    const socket = ctx.proxyToServerMitmSocket;

    if (!socket.isReusable() || isCloseRequested) {
      return socket.close();
    }

    socket.isReused = true;

    const pool = this.getSocketPoolByOrigin(ctx.url.origin);
    const pending = pool.pending.shift();
    if (pending) {
      pending.resolve(socket);
    } else {
      pool.free.push(socket);
    }
  }

  public close(): void {
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
    for (const socket of this.sockets) {
      socket.close();
    }
    this.sockets.clear();
  }

  /////// ////////// Socket Connection Management ///////////////////////////////////////////////////

  private async createSocketConnection(
    ctx: IMitmRequestContext,
    options: RequestOptions,
  ): Promise<MitmSocket> {
    const session = this.session;
    const tlsProfileId = session.networkInterceptorDelegate.tls?.emulatorProfileId;
    const isKeepAlive =
      ((options.headers.connection ?? options.headers.Connection) as string)?.match(
        /keep-alive/i,
      ) ?? true;

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

  private async assignSocket(
    ctx: IMitmRequestContext,
    requestSettings: RequestOptions,
  ): Promise<MitmSocket> {
    ctx.setState(ResourceState.GetSocket);
    let mitmSocket = await this.getAvailableSocket(ctx, requestSettings);
    if (!mitmSocket) {
      mitmSocket = await this.waitForFreeSocket(ctx.url.origin);
    }
    MitmRequestContext.assignMitmSocket(ctx, mitmSocket);
    return mitmSocket;
  }

  private waitForFreeSocket(origin: string): Promise<MitmSocket> {
    const socketPool = this.getSocketPoolByOrigin(origin);
    const pending = createPromise<MitmSocket>();
    socketPool.pending.push(pending);
    return pending.promise;
  }

  private getSocketPoolByOrigin(origin: string): ISocketPool {
    if (!this.socketPoolByOrigin[origin]) {
      this.socketPoolByOrigin[origin] = {
        alpn: null,
        queue: new Queue('SOCKET TO ORIGIN'),
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
  ): Promise<void> {
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

  private getAvailableSocket(
    ctx: IMitmRequestContext,
    options: RequestOptions,
  ): Promise<MitmSocket> {
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

  private async http1Request(
    ctx: IMitmRequestContext,
    requestSettings: http.RequestOptions,
  ): Promise<http.ClientRequest> {
    const httpModule = ctx.isSSL ? https : http;
    ctx.setState(ResourceState.CreateProxyToServerRequest);

    let didHaveFlushErrors = false;

    const request = httpModule.request({
      ...requestSettings,
      createConnection: () => ctx.proxyToServerMitmSocket.socket,
      agent: null,
    });

    function initError(error): void {
      if (error.code === 'ECONNRESET') {
        didHaveFlushErrors = true;
        return;
      }
      log.info(`MitmHttpRequest.Http1SendRequestError`, {
        sessionId: ctx.requestSession.sessionId,
        request: requestSettings,
        error,
      });
    }

    request.once('error', initError);

    let response: http.IncomingMessage;
    request.once('response', x => {
      response = x;
    });
    const rebroadcast = (event: string, handler: (result: any) => void): http.ClientRequest => {
      if (event === 'response' && response) {
        handler(response);
        response = null;
      }
      // hand off to another fn
      if (event === 'error') request.off('error', initError);
      return request;
    };
    const originalOn = request.on.bind(request);
    const originalOnce = request.once.bind(request);
    request.on = function onOverride(event, handler): http.ClientRequest {
      originalOn(event, handler);
      return rebroadcast(event, handler);
    };
    request.once = function onOverride(event, handler): http.ClientRequest {
      originalOnce(event, handler);
      return rebroadcast(event, handler);
    };

    // if re-using, we need to make sure the connection can still be written to by probing it
    if (ctx.proxyToServerMitmSocket.isReused) {
      if (!request.headersSent) request.flushHeaders();
      // give this 100 ms to flush (go is on a wait timer right now)
      await new Promise(resolve => setTimeout(resolve, 100));
      if (didHaveFlushErrors) {
        await this.assignSocket(ctx, requestSettings);
        return this.http1Request(ctx, requestSettings);
      }
    }
    return request;
  }

  /////// ////////// Http2 helpers //////////////////////////////////////////////////////////////////

  private http2Request(ctx: IMitmRequestContext): http2.ClientHttp2Stream {
    const client = this.createHttp2Session(ctx);
    ctx.setState(ResourceState.CreateProxyToServerRequest);
    return client.request(ctx.requestHeaders, { waitForTrailers: true });
  }

  private async onHttp2ServerToProxyPush(
    parentContext: IMitmRequestContext,
    serverPushStream: http2.ClientHttp2Stream,
    headers: http2.IncomingHttpHeaders & http2.IncomingHttpStatusHeader,
    flags: number,
    rawHeaders: string[],
  ): Promise<void> {
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
    this.session.trackResourceRedirects(pushContext);
    pushContext.setState(ResourceState.ServerToProxyPush);
    this.session.emit('request', MitmRequestContext.toEmittedResource(pushContext));

    if (BlockHandler.shouldBlockRequest(pushContext)) {
      await pushContext.browserHasRequested;
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
    try {
      clientToProxyRequest.stream.pushStream(
        pushContext.requestHeaders,
        this.handleHttp2ProxyToClientPush.bind(this, pushContext, onResponseHeaders),
      );
    } catch (error) {
      log.warn('Http2.ClientToProxy.CreatePushStreamError', {
        sessionId,
        error,
      });
    }
  }

  private async handleHttp2ProxyToClientPush(
    pushContext: IMitmRequestContext,
    onResponseHeaders: Promise<void>,
    createPushStreamError: Error,
    proxyToClientPushStream: ServerHttp2Stream,
  ): Promise<void> {
    pushContext.setState(ResourceState.ProxyToClientPushResponse);
    const serverToProxyPushStream = pushContext.serverToProxyResponse as ClientHttp2Stream;
    const cache = pushContext.cacheHandler;
    const session = this.session;
    const sessionId = session.sessionId;

    if (createPushStreamError) {
      log.warn('Http2.ClientToProxy.PushStreamError', {
        sessionId,
        error: createPushStreamError,
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

    try {
      if (cache.shouldServeCachedData) {
        if (!proxyToClientPushStream.destroyed) {
          proxyToClientPushStream.write(cache.cacheData, err => {
            if (err)
              this.onHttp2PushError(pushContext, 'Http2PushProxyToClient.CacheWriteError', err);
          });
        }
        if (!serverToProxyPushStream.destroyed) {
          serverToProxyPushStream.close(http2.constants.NGHTTP2_REFUSED_STREAM);
        }
      } else {
        proxyToClientPushStream.respond(pushContext.responseHeaders, { waitForTrailers: true });
        proxyToClientPushStream.on('wantTrailers', (): void => {
          pushContext.responseTrailers = trailers;
          proxyToClientPushStream.sendTrailers(pushContext.responseTrailers ?? {});
        });

        pushContext.setState(ResourceState.ServerToProxyPushResponse);
        for await (const chunk of serverToProxyPushStream) {
          if (proxyToClientPushStream.destroyed || serverToProxyPushStream.destroyed) return;
          cache.onResponseData(chunk);
          proxyToClientPushStream.write(chunk, err => {
            if (err) this.onHttp2PushError(pushContext, 'Http2PushProxyToClient.WriteError', err);
          });
        }
        if (!serverToProxyPushStream.destroyed) serverToProxyPushStream.end();
      }

      if (!proxyToClientPushStream.destroyed) proxyToClientPushStream.end();
      cache.onResponseEnd();

      await HeadersHandler.determineResourceType(pushContext);
      await pushContext.browserHasRequested;
      this.session.emit('response', MitmRequestContext.toEmittedResource(pushContext));
    } catch (writeError) {
      this.onHttp2PushError(pushContext, 'Http2PushProxyToClient.UnhandledError', writeError);
      if (!proxyToClientPushStream.destroyed) proxyToClientPushStream.destroy();
    }
  }

  private onHttp2PushError(pushContext: IMitmRequestContext, kind: string, error: Error): void {
    const isCanceled = error instanceof CanceledPromiseError;
    const { requestSession } = pushContext;

    pushContext.setState(ResourceState.Error);
    requestSession.emit('http-error', {
      request: MitmRequestContext.toEmittedResource(pushContext),
      error,
    });

    if (!isCanceled && !requestSession.isClosing && !error[hasBeenLoggedSymbol]) {
      log.info(`MitmHttpRequest.${kind}`, {
        sessionId: requestSession.sessionId,
        request: `H2PUSH: ${pushContext.url.href}`,
        error,
      });
    }
  }

  private getHttp2Session(origin: string): IHttp2Session | undefined {
    return this.http2Sessions.find(x => {
      if (x.origin === origin) return true;
      return x.client.originSet?.includes(origin);
    });
  }

  private createHttp2Session(ctx: IMitmRequestContext): ClientHttp2Session {
    const origin = ctx.url.origin;
    const existing = this.getHttp2Session(origin);
    if (existing) return existing.client;

    const session = (ctx.clientToProxyRequest as Http2ServerRequest).stream?.session;

    ctx.setState(ResourceState.CreateH2Session);
    const proxyToServerH2Client = http2.connect(origin, {
      createConnection: () => ctx.proxyToServerMitmSocket.socket,
    });

    proxyToServerH2Client.on('stream', this.onHttp2ServerToProxyPush.bind(this, ctx));
    proxyToServerH2Client.on('error', error => {
      log.warn('Http2Client.error', {
        sessionId: this.session.sessionId,
        origin,
        error,
      });
      if (session && !session.destroyed) session.destroy(error);
    });

    proxyToServerH2Client.on('close', () => {
      log.info('Http2Client.close', {
        sessionId: this.session.sessionId,
        origin,
      });
      if (session && !session.destroyed) session.destroy();
    });

    proxyToServerH2Client.on('remoteSettings', settings => {
      log.stats('Http2Client.remoteSettings', {
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
      log.stats('Http2.goaway', {
        sessionId: this.session.sessionId,
        origin,
        args,
      });
      this.closeHttp2Session(proxyToServerH2Client);
    });

    proxyToServerH2Client.on('altsvc', (alt, altOrigin) => {
      log.stats('Http2.altsvc', {
        sessionId: this.session.sessionId,
        origin,
        altOrigin,
        alt,
      });
    });

    proxyToServerH2Client.on('origin', origins => {
      log.stats('Http2.origin', {
        sessionId: this.session.sessionId,
        origin,
        origins,
      });
    });

    proxyToServerH2Client.on('close', () => {
      log.stats('Http2.close', {
        sessionId: this.session.sessionId,
        origin,
      });
      this.closeHttp2Session(proxyToServerH2Client);
    });

    this.http2Sessions.push({
      origin,
      client: proxyToServerH2Client,
      mitmSocket: ctx.proxyToServerMitmSocket,
    });

    return proxyToServerH2Client;
  }

  private closeHttp2Session(client: ClientHttp2Session): void {
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
