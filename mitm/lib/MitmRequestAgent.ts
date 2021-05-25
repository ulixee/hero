import MitmSocket, { IGoTlsSocketConnectOpts } from '@secret-agent/mitm-socket';
import * as http2 from 'http2';
import { ClientHttp2Session, Http2ServerRequest } from 'http2';
import Log from '@secret-agent/commons/Logger';
import * as https from 'https';
import { RequestOptions } from 'https';
import * as http from 'http';
import MitmSocketSession from '@secret-agent/mitm-socket/lib/MitmSocketSession';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import MitmRequestContext from './MitmRequestContext';
import RequestSession from '../handlers/RequestSession';
import HeadersHandler from '../handlers/HeadersHandler';
import ResourceState from '../interfaces/ResourceState';
import SocketPool from './SocketPool';
import Http2PushPromiseHandler from '../handlers/Http2PushPromiseHandler';

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
  private readonly socketPoolByResolvedHost = new Map<string, SocketPool>();

  constructor(session: RequestSession) {
    this.session = session;
    const socketSettings = session.networkEmulation?.socketSettings;
    this.socketSession = new MitmSocketSession(session.sessionId, {
      rejectUnauthorized: allowUnverifiedCertificates === false,
      clientHelloId: socketSettings?.tlsClientHelloId,
      tcpTtl: socketSettings?.tcpTtl,
      tcpWindowSize: socketSettings?.tcpWindowSize,
    });
    this.maxConnectionsPerOrigin =
      socketSettings?.socketsPerOrigin ?? MitmRequestAgent.defaultMaxConnectionsPerOrigin;
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

    ctx.setState(ResourceState.BeforeSendRequest);

    const emulation = ctx.requestSession.networkEmulation;

    if (ctx.isServerHttp2) {
      // NOTE: must come after connect to know if http2
      if (emulation.beforeHttpRequest) {
        await emulation.beforeHttpRequest(ctx);
      }
      HeadersHandler.prepareRequestHeadersForHttp2(ctx);
      return this.http2Request(ctx);
    }

    if (!ctx.requestHeaders.host && !ctx.requestHeaders.Host) {
      ctx.requestHeaders.Host = ctx.url.host;
    }
    if (emulation.beforeHttpRequest) {
      await emulation.beforeHttpRequest(ctx);
    }
    HeadersHandler.cleanHttp1RequestHeaders(ctx);

    requestSettings.headers = ctx.requestHeaders;
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
    this.socketPoolByResolvedHost.clear();
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
        keylogPath: process.env.SSLKEYLOGFILE,
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
    const weight = (ctx.clientToProxyRequest as Http2ServerRequest).stream?.state?.weight;

    return client.request(ctx.requestHeaders, { waitForTrailers: true, weight });
  }

  private createHttp2Session(ctx: IMitmRequestContext): ClientHttp2Session {
    const origin = ctx.url.origin;
    let originSocketPool: SocketPool;
    let resolvedHost: string;
    if (ctx.dnsResolvedIp) {
      const port = ctx.url.port || (ctx.isSSL ? 443 : 80);
      resolvedHost = `${ctx.dnsResolvedIp}:${port}`;
      originSocketPool = this.socketPoolByResolvedHost.get(resolvedHost);
    }
    originSocketPool ??= this.getSocketPoolByOrigin(origin);

    if (resolvedHost && !this.socketPoolByResolvedHost.has(resolvedHost)) {
      this.socketPoolByResolvedHost.set(resolvedHost, originSocketPool);
    }

    const existing = originSocketPool.getHttp2Session();
    if (existing) return existing.client;

    const session = (ctx.clientToProxyRequest as Http2ServerRequest).stream?.session;

    ctx.setState(ResourceState.CreateH2Session);
    const clientSettings = session?.remoteSettings;
    const proxyToServerH2Client = http2.connect(origin, {
      settings: clientSettings,
      createConnection: () => ctx.proxyToServerMitmSocket.socket,
    });
    if (session) {
      session.on('ping', bytes => {
        proxyToServerH2Client.ping(bytes, () => null);
      });
    }

    proxyToServerH2Client.on('stream', async (stream, headers, flags, rawHeaders) => {
      try {
        const pushPromise = new Http2PushPromiseHandler(ctx, stream, headers, flags, rawHeaders);
        await pushPromise.onRequest();
      } catch (error) {
        log.warn('Http2.ClientToProxy.ReadPushPromiseError', {
          sessionId: ctx.requestSession.sessionId,
          rawHeaders,
          error,
        });
      }
    });
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
