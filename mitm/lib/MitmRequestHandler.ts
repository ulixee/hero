import * as http from 'http';
import Log from '@secret-agent/commons/Logger';
import * as net from 'net';
import * as http2 from 'http2';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import HttpResponseCache from './HttpResponseCache';
import RequestSession from '../handlers/RequestSession';
import BlockHandler from '../handlers/BlockHandler';
import HeadersHandler from '../handlers/HeadersHandler';
import CookieHandler from '../handlers/CookieHandler';
import MitmRequestContext from './MitmRequestContext';
import { parseRawHeaders } from './Utils';

const { log } = Log(module);

export default class MitmRequestHandler {
  constructor(
    readonly responseCache: HttpResponseCache,
    readonly handleError: (kind: string, ctx: IMitmRequestContext, error: Error) => any,
  ) {}

  public async handleRequest(
    isSSL: boolean,
    clientRequest: http.IncomingMessage | http2.Http2ServerRequest,
    clientResponse: http.ServerResponse | http2.Http2ServerResponse,
  ) {
    clientRequest.pause();

    const ctx = MitmRequestContext.create(
      this.responseCache,
      'http',
      isSSL,
      clientRequest,
      clientResponse,
    );
    if (!ctx) return;

    clientResponse.on('error', this.handleError.bind(this, 'ProxyToClient.ResponseError', ctx));

    try {
      const didSend = await this.makeProxyToServerRequest(ctx);
      if (!didSend) return;

      clientRequest.resume();
      const data: Buffer[] = [];
      for await (const chunk of clientRequest) {
        data.push(chunk);
        ctx.proxyToServerRequest.write(chunk, error => {
          if (error) this.handleError('ProxyToServer.WriteError', ctx, error);
        });
      }
      HeadersHandler.sendRequestTrailers(ctx);
      ctx.proxyToServerRequest.end();
      ctx.requestPostData = Buffer.concat(data);
    } catch (err) {
      this.handleError('ClientToProxy.HandlerError', ctx, err);
    }
  }

  public async handleUpgrade(
    isSSL: boolean,
    upgradeRequest: http.IncomingMessage,
    clientSocket: net.Socket,
    clientHead: Buffer,
  ) {
    // socket resumes in upgradeResponseHandler
    clientSocket.pause();

    const ctx = MitmRequestContext.create(this.responseCache, 'ws', isSSL, upgradeRequest);
    if (!ctx) return;

    clientSocket.on(
      'error',
      this.handleError.bind(this, 'ClientToProxy.UpgradeSocketError', ctx),
    );

    try {
      const didSend = await this.makeProxyToServerRequest(ctx);
      if (!didSend) return;

      ctx.proxyToServerRequest.on(
        'upgrade',
        this.upgradeResponseHandler.bind(this, ctx, clientSocket, clientHead),
      );
      ctx.proxyToServerRequest.end();
    } catch (err) {
      this.handleError('ClientToProxy.UpgradeHandlerError', ctx, err);
    }
  }

  private async makeProxyToServerRequest(ctx: IMitmRequestContext) {
    let session: RequestSession;
    try {
      ctx.clientToProxyRequest.on(
        'error',
        this.handleError.bind(this, 'ClientToProxy.RequestError', ctx),
      );

      session = await RequestSession.getSession(
        ctx.requestHeaders,
        ctx.method,
        ctx.isUpgrade,
        ctx.isUpgrade ? 10e3 : undefined,
      );
      ctx.requestSession = session;

      if (!session) {
        log.error('Mitm.RequestHandler:NoSessionForRequest', {
          sessionId: null,
          url: ctx.url,
          headers: ctx.requestOriginalHeaders,
          method: ctx.method,
        });
        const err = new Error('No Session ID provided');
        (err as any).isLogged = true;
        this.handleError('ClientToProxy.NoSessionError', ctx, err);
        return;
      }

      // track request
      session.trackResource(ctx);
      session.emit('request', MitmRequestContext.toEmittedResource(ctx));

      log.info(`Http.Request`, {
        sessionId: session.sessionId,
        url: ctx.url.href,
        hasSession: !!session,
        isSSL: ctx.isSSL,
        isHttpUpgrade: ctx.isUpgrade,
      });

      if (BlockHandler.shouldBlockRequest(ctx)) {
        // already wrote reply
        return;
      }

      await HeadersHandler.waitForResource(ctx);
      await CookieHandler.setProxyToServerCookies(ctx);

      ctx.cacheHandler.onRequest();

      await HeadersHandler.modifyHeaders(ctx);

      // do one more check on the session before doing a connect
      if (session.isClosing) return;

      ctx.proxyToServerRequest = await session.requestAgent.request(
        ctx,
        this.httpResponseHandler.bind(this, ctx),
      );
      ctx.proxyToServerRequest.on(
        'error',
        this.handleError.bind(this, 'ProxyToServer.RequestError', ctx),
      );

      return true;
    } catch (err) {
      if (session?.isClosing) {
        return;
      }
      this.handleError('ProxyToServer.RequestHandlerError', ctx, err);
    }
  }

  private async upgradeResponseHandler(
    ctx: IMitmRequestContext,
    clientSocket: net.Socket,
    clientHead: Buffer,
    serverResponse: http.IncomingMessage,
    serverSocket: net.Socket,
    serverHead: Buffer,
  ) {
    serverSocket.pause();
    MitmRequestContext.readHttp1Response(ctx, serverResponse);
    ctx.serverToProxyResponseStream = serverResponse;

    const socketConnection = ctx.proxyToServerSocket;

    clientSocket.on('end', () => socketConnection.close());
    serverSocket.on('end', () => socketConnection.close());
    socketConnection.on('close', () => {
      // don't try to write again
      clientSocket.destroy();
      serverSocket.destroy();
    });

    // copy response message (have to write to raw socket)
    let responseMessage = `HTTP/${serverResponse.httpVersion} ${serverResponse.statusCode} ${serverResponse.statusMessage}\r\n`;
    for (let i = 0; i < serverResponse.rawHeaders.length; i += 2) {
      responseMessage += `${serverResponse.rawHeaders[i]}: ${serverResponse.rawHeaders[i + 1]}\r\n`;
    }
    await CookieHandler.readServerResponseCookies(ctx);

    clientSocket.write(`${responseMessage}\r\n`);

    if (!serverSocket.readable || !serverSocket.writable) {
      return serverSocket.destroy();
    }
    serverSocket.on(
      'error',
      this.handleError.bind(this, 'ServerToProxy.UPGRADE_SOCKET_ERROR', ctx),
    );

    if (serverResponse.statusCode === 101) {
      clientSocket.setNoDelay(true);
      clientSocket.setTimeout(0);

      serverSocket.setNoDelay(true);
      serverSocket.setTimeout(0);
    }

    serverSocket.pipe(clientSocket);
    clientSocket.pipe(serverSocket);

    serverSocket.resume();
    clientSocket.resume();
    if (serverHead.length > 0) serverSocket.unshift(serverHead);
    if (clientHead.length > 0) clientSocket.unshift(clientHead);

    ctx.requestSession.emit('response', MitmRequestContext.toEmittedResource(ctx));
  }

  private async httpResponseHandler(
    ctx: IMitmRequestContext,
    serverToProxyResponse: http.IncomingMessage | http2.ClientHttp2Stream,
  ) {
    ctx.serverToProxyResponseStream = serverToProxyResponse;
    ctx.responseTime = new Date();
    serverToProxyResponse.on(
      'error',
      this.handleError.bind(this, 'ServerToProxy.ResponseError', ctx),
    );

    try {
      HeadersHandler.restorePreflightHeader(ctx);
      ctx.cacheHandler.onResponseHeaders();
    } catch (err) {
      return this.handleError('ServerToProxy.ResponseHeadersHandlerError', ctx, err);
    }

    if (redirectCodes.has(ctx.status)) {
      const redirectLocation = ctx.responseHeaders.location || ctx.responseHeaders.Location;
      if (redirectLocation) {
        ctx.redirectedToUrl = redirectLocation as string;
        ctx.responseUrl = ctx.redirectedToUrl;
      }
    }
    await CookieHandler.readServerResponseCookies(ctx);

    if (!ctx.proxyToClientResponse) {
      log.warn('Error.NoProxyToClientResponse', { sessionId: ctx.requestSession.sessionId });
      return;
    }

    ctx.proxyToClientResponse.writeHead(ctx.status, ctx.responseHeaders);

    serverToProxyResponse.once('trailers', headers => {
      ctx.responseTrailers = headers;
    });

    for await (const chunk of serverToProxyResponse) {
      const data = ctx.cacheHandler.onResponseData(chunk as Buffer);
      if (data) {
        ctx.proxyToClientResponse.write(data, error => {
          if (error) this.handleError('ServerToProxy.WriteResponseError', ctx, error);
        });
      }
    }
    if (ctx.cacheHandler.shouldServeCachedData) {
      ctx.proxyToClientResponse.write(ctx.cacheHandler.cacheData, error => {
        if (error) this.handleError('ServerToProxy.WriteCachedResponseError', ctx, error);
      });
    }

    if (serverToProxyResponse instanceof http.IncomingMessage) {
      ctx.responseTrailers = parseRawHeaders(serverToProxyResponse.rawTrailers);
    }
    if (ctx.responseTrailers) {
      ctx.proxyToClientResponse.addTrailers(ctx.responseTrailers);
    }
    ctx.proxyToClientResponse.end();

    ctx.cacheHandler.onResponseEnd();
    ctx.requestSession.emit('response', MitmRequestContext.toEmittedResource(ctx));

    process.nextTick(agent => agent.freeSocket(ctx), ctx.requestSession.requestAgent);
  }
}

export const redirectCodes = new Set([300, 301, 302, 303, 305, 307, 308]);
