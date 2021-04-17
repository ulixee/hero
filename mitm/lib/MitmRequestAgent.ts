import MitmSocket, { IGoTlsSocketConnectOpts } from '@secret-agent/mitm-socket';
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
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import MitmSocketSession from '@secret-agent/mitm-socket/lib/MitmSocketSession';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import MitmRequestContext from './MitmRequestContext';
import RequestSession from '../handlers/RequestSession';
import BlockHandler from '../handlers/BlockHandler';
import HeadersHandler from '../handlers/HeadersHandler';
import ResourceState from '../interfaces/ResourceState';
import SocketPool from './SocketPool';

const { log } = Log(module);

// TODO: this is off by default because golang 1.14 has an issue verifying certain certificate authorities:
// https://github.com/golang/go/issues/24652
// https://github.com/golang/go/issues/38365
const allowUnverifiedCertificates = Boolean(JSON.parse(process.env.MITM_ALLOW_INSECURE ?? 'true'));

export default class MitmRequestAgent {
  public static defaultMaxConnectionsPerOrigin = 6;
  public readonly socketSession: MitmSocketSession;
  private readonly session: RequestSession;
  private readonly maxConnectionsPerOrigin: number;

  private readonly socketPoolByOrigin = new Map<string, SocketPool>();

  constructor(session: RequestSession) {
    this.session = session;
    this.socketSession = new MitmSocketSession(session.sessionId, {
      rejectUnauthorized: allowUnverifiedCertificates === false,
      clientHelloId: session.networkInterceptorDelegate.tls?.emulatorProfileId,
      tcpTtl: session.networkInterceptorDelegate.tcp?.ttl,
      tcpWindowSize: session.networkInterceptorDelegate.tcp?.windowSize,
    });
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
      insecureHTTPParser: true, // if we don't include this setting, invalid characters in http requests will blow up responses
    } as any;

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
    const headers = ctx.responseOriginalHeaders;
    let isCloseRequested = false;

    if (headers) {
      if (headers.Connection === 'close' || headers.connection === 'close') {
        isCloseRequested = true;
      }
    }
    const socket = ctx.proxyToServerMitmSocket;

    if (!socket.isReusable() || isCloseRequested) {
      return socket.close();
    }

    socket.isReused = true;

    const pool = this.getSocketPoolByOrigin(ctx.url.origin);
    pool?.freeSocket(ctx.proxyToServerMitmSocket);
  }

  public close(): void {
    try {
      this.socketSession.close();
    } catch (err) {
      // don't need to log closing sessions
    }
    for (const pool of this.socketPoolByOrigin.values()) {
      pool.close();
    }
  }

  private async assignSocket(
    ctx: IMitmRequestContext,
    options: RequestOptions,
  ): Promise<MitmSocket> {
    ctx.setState(ResourceState.GetSocket);
    const pool = this.getSocketPoolByOrigin(ctx.url.origin);
    let isKeepAlive = true;
    if (((options.headers.connection ?? options.headers.Connection) as string)?.match(/close/i)) {
      isKeepAlive = false;
    }
    const mitmSocket = await pool.getSocket(
      { isWebsocket: ctx.isUpgrade },
      this.createSocketConnection.bind(this, ctx, options, isKeepAlive),
    );
    MitmRequestContext.assignMitmSocket(ctx, mitmSocket);
    return mitmSocket;
  }

  private async createSocketConnection(
    ctx: IMitmRequestContext,
    options: IGoTlsSocketConnectOpts,
    keepAlive: boolean,
  ): Promise<MitmSocket> {
    const session = this.session;

    ctx.setState(ResourceState.LookupDns);
    const ipIfNeeded = await session.lookupDns(options.host);
    ctx.dnsResolvedIp = ipIfNeeded || 'Not Found';

    const mitmSocket = new MitmSocket(
      session.sessionId,
      {
        host: ipIfNeeded || options.host,
        port: String(options.port),
        isSsl: ctx.isSSL,
        servername: options.servername || options.host,
        keepAlive,
        isWebsocket: ctx.isUpgrade,
      },
      ctx.isUpgrade,
    );
    mitmSocket.on('connect', () => session.emit('socket-connect', { socket: mitmSocket }));

    if (session.upstreamProxyUrl) {
      ctx.setState(ResourceState.GetUpstreamProxyUrl);
      mitmSocket.setProxyUrl(session.upstreamProxyUrl);
    }

    ctx.setState(ResourceState.SocketConnect);
    await mitmSocket.connect(this.socketSession, 10e3);

    if (ctx.isUpgrade) {
      mitmSocket.socket.setNoDelay(true);
      mitmSocket.socket.setTimeout(0);
    }
    return mitmSocket;
  }

  private getSocketPoolByOrigin(origin: string): SocketPool {
    if (!this.socketPoolByOrigin.has(origin)) {
      this.socketPoolByOrigin.set(
        origin,
        new SocketPool(origin, this.maxConnectionsPerOrigin, this.session),
      );
    }

    return this.socketPoolByOrigin.get(origin);
  }

  private async http1Request(
    ctx: IMitmRequestContext,
    requestSettings: http.RequestOptions,
  ): Promise<http.ClientRequest> {
    const httpModule = ctx.isSSL ? https : http;
    ctx.setState(ResourceState.CreateProxyToServerRequest);

    let didHaveFlushErrors = false;

    ctx.proxyToServerMitmSocket.receivedEOF = false;
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
    request.once('upgrade', x => {
      response = x;
    });

    // we have to rebroadcast because this function is async, so the handlers can register late
    const rebroadcastMissedEvent = (
      event: string,
      handler: (result: any) => void,
    ): http.ClientRequest => {
      if ((event === 'response' || event === 'upgrade') && response) {
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
      return rebroadcastMissedEvent(event, handler);
    };
    request.once = function onOverride(event, handler): http.ClientRequest {
      originalOnce(event, handler);
      return rebroadcastMissedEvent(event, handler);
    };

    // if re-using, we need to make sure the connection can still be written to by probing it
    if (ctx.proxyToServerMitmSocket.isReused) {
      if (!request.headersSent) request.flushHeaders();
      // give this 100 ms to flush (go is on a wait timer right now)
      await new Promise(resolve => setTimeout(resolve, 100));
      if (
        didHaveFlushErrors ||
        ctx.proxyToServerMitmSocket.isClosing ||
        ctx.proxyToServerMitmSocket.receivedEOF
      ) {
        const socket = ctx.proxyToServerMitmSocket;
        socket.close();
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

  private createHttp2Session(ctx: IMitmRequestContext): ClientHttp2Session {
    const origin = ctx.url.origin;
    const originSocketPool = this.getSocketPoolByOrigin(origin);

    const existing = originSocketPool.getHttp2Session();
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
      for (const svcOrigin of origins) {
        this.getSocketPoolByOrigin(svcOrigin).registerHttp2Session(
          proxyToServerH2Client,
          ctx.proxyToServerMitmSocket,
        );
      }
    });

    proxyToServerH2Client.on('close', () => {
      log.stats('Http2.close', {
        sessionId: this.session.sessionId,
        origin,
      });
    });

    originSocketPool.registerHttp2Session(proxyToServerH2Client, ctx.proxyToServerMitmSocket);

    return proxyToServerH2Client;
  }
}
