import MitmSocket from '@unblocked-web/agent-mitm-socket';
import * as http2 from 'http2';
import { ClientHttp2Session, Http2ServerRequest } from 'http2';
import * as https from 'https';
import * as http from 'http';
import MitmSocketSession from '@unblocked-web/agent-mitm-socket/lib/MitmSocketSession';
import IHttpHeaders from '@unblocked-web/specifications/agent/net/IHttpHeaders';
import ITcpSettings from '@unblocked-web/specifications/agent/net/ITcpSettings';
import ITlsSettings from '@unblocked-web/specifications/agent/net/ITlsSettings';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import IHttp2ConnectSettings from '@unblocked-web/specifications/agent/net/IHttp2ConnectSettings';
import IHttpSocketConnectOptions from '@unblocked-web/specifications/agent/net/IHttpSocketConnectOptions';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import MitmRequestContext from './MitmRequestContext';
import RequestSession from '../handlers/RequestSession';
import HeadersHandler from '../handlers/HeadersHandler';
import ResourceState from '../interfaces/ResourceState';
import SocketPool from './SocketPool';
import Http2PushPromiseHandler from '../handlers/Http2PushPromiseHandler';
import Http2SessionBinding from './Http2SessionBinding';
import env from '../env';

export default class MitmRequestAgent {
  public static defaultMaxConnectionsPerOrigin = 6;
  public static connectTimeout = 10e3;
  public socketSession: MitmSocketSession;
  private session: RequestSession;
  private readonly maxConnectionsPerOrigin: number;
  private readonly events = new EventSubscriber();
  private readonly socketPoolByOrigin = new Map<string, SocketPool>();
  private readonly socketPoolByResolvedHost = new Map<string, SocketPool>();
  private logger: IBoundLog;

  constructor(session: RequestSession) {
    this.session = session;

    this.logger = session.logger.createChild(module);
    const tcpSettings: ITcpSettings = {};
    const tlsSettings: ITlsSettings = {};
    for (const hook of session.hooks) hook.onTcpConfiguration?.(tcpSettings);
    for (const hook of session.hooks) hook.onTlsConfiguration?.(tlsSettings);

    this.socketSession = new MitmSocketSession(session.logger, {
      rejectUnauthorized: env.allowInsecure === false,
      clientHelloId: tlsSettings?.tlsClientHelloId,
      tcpTtl: tcpSettings?.tcpTtl,
      tcpWindowSize: tcpSettings?.tcpWindowSize,
      debug: env.isDebug,
    });
    this.maxConnectionsPerOrigin =
      tlsSettings?.socketsPerOrigin ?? MitmRequestAgent.defaultMaxConnectionsPerOrigin;
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
      rejectUnauthorized: env.allowInsecure === false,
      // @ts-ignore
      insecureHTTPParser: true, // if we don't include this setting, invalid characters in http requests will blow up responses
    };

    await this.assignSocket(ctx, requestSettings as any);

    ctx.cacheHandler.onRequest();

    ctx.setState(ResourceState.BeforeSendRequest);

    if (ctx.isServerHttp2) {
      // NOTE: must come after connect to know if http2
      for (const hook of ctx.requestSession.hooks) {
        await hook.beforeHttpRequest?.(ctx);
      }
      HeadersHandler.prepareRequestHeadersForHttp2(ctx);
      return this.http2Request(ctx);
    }

    if (!ctx.requestHeaders.host && !ctx.requestHeaders.Host) {
      ctx.requestHeaders.Host = ctx.url.host;
    }
    HeadersHandler.cleanProxyHeaders(ctx);
    for (const hook of ctx.requestSession.hooks) {
      await hook.beforeHttpRequest?.(ctx);
    }

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
    if (!this.socketSession) return;
    try {
      this.socketSession.close();
      this.socketSession = null;
    } catch (err) {
      // don't need to log closing sessions
    }
    for (const pool of this.socketPoolByOrigin.values()) {
      pool.close();
    }
    this.socketPoolByOrigin.clear();
    this.socketPoolByResolvedHost.clear();
    this.events.close('error');
    this.session = null;
  }

  public async isHostAlpnH2(hostname: string, port: string): Promise<boolean> {
    const pool = this.getSocketPoolByOrigin(`${hostname}:${port}`);

    const options = { host: hostname, port, isSsl: true, keepAlive: true, servername: hostname };
    return await pool.isHttp2(false, this.createSocketConnection.bind(this, options));
  }

  public async createSocketConnection(options: IHttpSocketConnectOptions): Promise<MitmSocket> {
    const session = this.session;

    const dnsLookupTime = new Date();
    const ipIfNeeded = await session.lookupDns(options.host);

    const mitmSocket = new MitmSocket(session.sessionId, session.logger, {
      host: ipIfNeeded || options.host,
      port: String(options.port),
      isSsl: options.isSsl,
      servername: options.servername || options.host,
      keepAlive: options.keepAlive,
      isWebsocket: options.isWebsocket,
      keylogPath: env.sslKeylogFile,
      debug: options.debug ?? env.isDebug,
    });
    mitmSocket.dnsResolvedIp = ipIfNeeded;
    mitmSocket.dnsLookupTime = dnsLookupTime;
    this.events.on(mitmSocket, 'connect', () =>
      session.emit('socket-connect', { socket: mitmSocket }),
    );

    if (session.upstreamProxyUrl) {
      mitmSocket.setProxyUrl(session.upstreamProxyUrl);
    }

    await mitmSocket.connect(this.socketSession, 10e3);

    if (options.isWebsocket) {
      mitmSocket.socket.setNoDelay(true);
      mitmSocket.socket.setTimeout(0);
    }
    return mitmSocket;
  }

  private async assignSocket(
    ctx: IMitmRequestContext,
    options: IHttpSocketConnectOptions & { headers: IHttpHeaders },
  ): Promise<MitmSocket> {
    ctx.setState(ResourceState.GetSocket);
    const pool = this.getSocketPoolByOrigin(ctx.url.origin);

    options.isSsl = ctx.isSSL;
    options.keepAlive = !(
      (options.headers.connection ?? options.headers.Connection) as string
    )?.match(/close/i);
    options.isWebsocket = ctx.isUpgrade;

    const mitmSocket = await pool.getSocket(
      options.isWebsocket,
      this.createSocketConnection.bind(this, options),
    );
    MitmRequestContext.assignMitmSocket(ctx, mitmSocket);
    return mitmSocket;
  }

  private getSocketPoolByOrigin(origin: string): SocketPool {
    let lookup = origin.split('://').pop();
    if (!lookup.includes(':') && origin.includes('://')) {
      const isSecure = origin.startsWith('wss://') || origin.startsWith('https://');
      if (isSecure) lookup += ':443';
      else lookup += ':80';
    }
    if (!this.socketPoolByOrigin.has(lookup)) {
      this.socketPoolByOrigin.set(
        lookup,
        new SocketPool(lookup, this.maxConnectionsPerOrigin, this.session),
      );
    }

    return this.socketPoolByOrigin.get(lookup);
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

    this.events.on(request, 'error', error => {
      this.logger.info(`MitmHttpRequest.Http1SendRequestError`, {
        request: requestSettings,
        error,
      });
    });

    const flushListener = this.events.once(request, 'error', error => {
      if (error.code === 'ECONNRESET') {
        didHaveFlushErrors = true;
      }
    });

    let callbackArgs: any[];
    request.once('response', (...args: any[]) => {
      callbackArgs = args;
    });
    request.once('upgrade', (...args: any[]) => {
      callbackArgs = args;
    });

    // we have to rebroadcast because this function is async, so the handlers can register late
    const rebroadcastMissedEvent = (
      event: string,
      handler: (...args: any[]) => void,
    ): http.ClientRequest => {
      if ((event === 'response' || event === 'upgrade') && callbackArgs) {
        handler(...callbackArgs);
        callbackArgs = null;
      }
      // hand off to another fn
      if (event === 'error') this.events.off(flushListener);
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
        await this.assignSocket(ctx, requestSettings as any);
        return this.http1Request(ctx, requestSettings);
      }
    }
    return request;
  }

  /////// ////////// Http2 helpers //////////////////////////////////////////////////////////////////

  private async http2Request(ctx: IMitmRequestContext): Promise<http2.ClientHttp2Stream> {
    const client = await this.createHttp2Session(ctx);
    ctx.setState(ResourceState.CreateProxyToServerRequest);
    const weight = (ctx.clientToProxyRequest as Http2ServerRequest).stream?.state?.weight;

    return client.request(ctx.requestHeaders, { waitForTrailers: true, weight, exclusive: true });
  }

  private async createHttp2Session(ctx: IMitmRequestContext): Promise<ClientHttp2Session> {
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

    const clientToProxyH2Session = (ctx.clientToProxyRequest as Http2ServerRequest).stream?.session;

    ctx.setState(ResourceState.CreateH2Session);

    const settings: IHttp2ConnectSettings = {
      settings: clientToProxyH2Session?.remoteSettings,
      localWindowSize: clientToProxyH2Session?.state.localWindowSize,
    };
    for (const hook of ctx.requestSession.hooks) {
      await hook.onHttp2SessionConnect?.(ctx, settings);
    }

    const connectPromise = new Resolvable<void>();
    const proxyToServerH2Client = http2.connect(
      origin,
      {
        settings: settings.settings,
        createConnection: () => ctx.proxyToServerMitmSocket.socket,
      },
      async remoteSession => {
        if ('setLocalWindowSize' in remoteSession && settings.localWindowSize) {
          // @ts-ignore
          remoteSession.setLocalWindowSize(settings.localWindowSize);
          await new Promise(setImmediate);
        }
        connectPromise.resolve();
      },
    );

    const binding = new Http2SessionBinding(
      clientToProxyH2Session,
      proxyToServerH2Client,
      this.events,
      this.session.logger,
      {
        origin,
      },
    );
    this.events.on(proxyToServerH2Client, 'stream', async (stream, headers, flags, rawHeaders) => {
      try {
        const pushPromise = new Http2PushPromiseHandler(ctx, stream, headers, flags, rawHeaders);
        await pushPromise.onRequest();
      } catch (error) {
        this.logger.warn('Http2.ClientToProxy.ReadPushPromiseError', {
          rawHeaders,
          error,
        });
      }
    });
    this.events.on(proxyToServerH2Client, 'origin', origins => {
      for (const svcOrigin of origins) {
        this.getSocketPoolByOrigin(svcOrigin).registerHttp2Session(
          proxyToServerH2Client,
          ctx.proxyToServerMitmSocket,
          binding,
        );
      }
    });

    originSocketPool.registerHttp2Session(
      proxyToServerH2Client,
      ctx.proxyToServerMitmSocket,
      binding,
    );

    await connectPromise;
    return proxyToServerH2Client;
  }
}
