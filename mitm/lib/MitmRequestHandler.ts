import { IncomingMessage, ServerResponse } from 'http';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import { cleanMitmHeaders, filterAndCanonizeHeaders } from './Utils';
import HttpResponseCache from './HttpResponseCache';
import RequestSession from '../handlers/RequestSession';
import BlockHandler from '../handlers/BlockHandler';
import HeadersHandler from '../handlers/HeadersHandler';
import Log from '@secret-agent/commons/Logger';
import CookieHandler from '../handlers/CookieHandler';
import IHttpOrH2Response from '../interfaces/IHttpOrH2Response';
import * as net from 'net';
import MitmRequestContext from './MitmRequestContext';
import CacheHandler from '../handlers/CacheHandler';

const { log } = Log(module);

export default class MitmRequestHandler {
  constructor(
    readonly responseCache: HttpResponseCache,
    readonly handleError: (kind: string, ctx: IMitmRequestContext, error: Error) => any,
  ) {}

  public async handleRequest(
    isSSL: boolean,
    clientRequest: IncomingMessage,
    clientResponse: ServerResponse,
  ) {
    clientRequest.pause();

    const cacheHandler = new CacheHandler(this.responseCache);
    const ctx = MitmRequestContext.create(
      cacheHandler,
      'http',
      isSSL,
      clientRequest,
      clientResponse,
    );
    if (!ctx) return;

    clientResponse.on('error', this.handleError.bind(this, 'PROXY_TO_CLIENT_RESPONSE_ERROR', ctx));

    try {
      const didSend = await this.makeProxyToServerRequest(ctx);
      if (!didSend) return;

      clientRequest.resume();
      const data: Buffer[] = [];
      for await (const chunk of clientRequest) {
        data.push(chunk);
        ctx.proxyToServerRequest.write(chunk);
      }
      ctx.proxyToServerRequest.end();
      ctx.postData = Buffer.concat(data);
    } catch (err) {
      this.handleError('ON_REQUEST_ERROR', ctx, err);
    }
  }

  public async handleUpgrade(
    isSSL: boolean,
    upgradeRequest: IncomingMessage,
    clientSocket: net.Socket,
    clientHead: Buffer,
  ) {
    // socket resumes in upgradeResponseHandler
    clientSocket.pause();

    const cacheHandler = new CacheHandler(this.responseCache);
    const ctx = MitmRequestContext.create(cacheHandler, 'ws', isSSL, upgradeRequest);
    if (!ctx) return;

    clientSocket.on(
      'error',
      this.handleError.bind(this, 'CLIENT_TO_PROXY_UPGRADE_SOCKET_ERROR', ctx),
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
      this.handleError('ON_UPGRADE_ERROR', ctx, err);
    }
  }

  private async makeProxyToServerRequest(ctx: IMitmRequestContext) {
    let session: RequestSession;
    try {
      ctx.clientToProxyRequest.on(
        'error',
        this.handleError.bind(this, 'CLIENT_TO_PROXY_REQUEST_ERROR', ctx),
      );

      const requestSettings = ctx.proxyToServerRequestSettings;
      session = ctx.requestSession = await RequestSession.getSession(
        requestSettings.headers,
        requestSettings.method,
        ctx.isUpgrade,
        ctx.isUpgrade ? 10e3 : undefined,
      );

      if (!session) {
        log.error('Mitm.RequestHandler:NoSessionForRequest', {
          sessionId: null,
          url: ctx.url,
          headers: ctx.clientToProxyRequest.headers,
          method: ctx.clientToProxyRequest.method,
        });
        const err = new Error('No Session ID provided');
        (err as any).isLogged = true;
        this.handleError('NO_SESSION_ID', ctx, err);
        return;
      }

      // track request
      session.trackResource(ctx);
      session.emit('request', MitmRequestContext.toEmittedResource(ctx));

      log.info(`Mitm.handleRequest`, {
        sessionId: session.sessionId,
        url: ctx.url,
        hasSession: !!session,
        isSSL: ctx.isSSL,
        isHttpUpgrade: ctx.isUpgrade,
      });

      if (BlockHandler.shouldBlockRequest(session, ctx)) {
        // already wrote reply
        return;
      }

      await HeadersHandler.waitForResource(ctx);
      await CookieHandler.setProxyToServerCookies(ctx);

      ctx.cacheHandler.onRequest(ctx);

      await HeadersHandler.modifyHeaders(ctx, ctx.clientToProxyRequest);
      cleanMitmHeaders(ctx.proxyToServerRequestSettings.headers);

      // do one more check on the session before doing a connect
      if (session.isClosing) return;

      ctx.proxyToServerRequest = await session.requestAgent.request(
        ctx,
        this.httpResponseHandler.bind(this, ctx),
      );
      ctx.proxyToServerRequest.on(
        'error',
        this.handleError.bind(this, 'PROXY_TO_SERVER_REQUEST_ERROR', ctx),
      );

      return true;
    } catch (err) {
      if (session?.isClosing) {
        return;
      }
      this.handleError('PROXY_TO_SERVER_REQUEST_ERROR', ctx, err);
    }
  }

  private async upgradeResponseHandler(
    ctx: IMitmRequestContext,
    clientSocket: net.Socket,
    clientHead: Buffer,
    serverResponse: IncomingMessage,
    serverSocket: net.Socket,
    serverHead: Buffer,
  ) {
    serverSocket.pause();
    ctx.serverToProxyResponse = serverResponse;
    ctx.serverToProxyResponse.responseTime = new Date();

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
      this.handleError.bind(this, 'SERVER_TO_PROXY_UPGRADE_SOCKET_ERROR', ctx),
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
    serverToProxyResponse: IHttpOrH2Response,
  ) {
    serverToProxyResponse.responseTime = new Date();
    ctx.serverToProxyResponse = serverToProxyResponse;
    serverToProxyResponse.on(
      'error',
      this.handleError.bind(this, 'SERVER_TO_PROXY_RESPONSE_ERROR', ctx),
    );

    try {
      HeadersHandler.restorePreflightHeader(ctx);
      ctx.cacheHandler.onResponseHeaders(ctx);
    } catch (err) {
      return this.handleError('ON_RESPONSE_HEADERS_HANDLER_ERROR', ctx, err);
    }

    if (
      ctx.requestSession &&
      redirectCodes.has(serverToProxyResponse.statusCode) &&
      serverToProxyResponse.headers.location
    ) {
      ctx.redirectedToUrl = serverToProxyResponse.headers.location;
    }
    await CookieHandler.readServerResponseCookies(ctx);

    if (!ctx.proxyToClientResponse) return;

    ctx.proxyToClientResponse.writeHead(
      serverToProxyResponse.statusCode,
      filterAndCanonizeHeaders(serverToProxyResponse.rawHeaders),
    );

    for await (const chunk of serverToProxyResponse) {
      const data = ctx.cacheHandler.onResponseData(ctx, chunk as Buffer);
      if (data) {
        ctx.proxyToClientResponse.write(data);
      }
    }

    if (ctx.cacheHandler.shouldServeCachedData) {
      ctx.proxyToClientResponse.write(ctx.cacheHandler.cacheData);
    }

    ctx.proxyToClientResponse.end();
    ctx.cacheHandler.onResponseEnd(ctx);
    ctx.requestSession.emit('response', MitmRequestContext.toEmittedResource(ctx));

    process.nextTick(agent => agent.freeSocket(ctx), ctx.requestSession.requestAgent);
  }
}

export const redirectCodes = new Set([300, 301, 302, 303, 305, 307, 308]);
