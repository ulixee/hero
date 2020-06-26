import http, { IncomingMessage, ServerResponse } from 'http';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import {
  cleanMitmHeaders,
  filterAndCanonizeHeaders,
  parseHostAndPort,
  parseRawHeaders,
} from './Utils';
import HttpResponseCache from './HttpResponseCache';
import CacheHandler from '../handlers/CacheHandler';
import RequestSession from '../handlers/RequestSession';
import SocketHandler from '../handlers/SocketHandler';
import BlockHandler from '../handlers/BlockHandler';
import HeadersHandler from '../handlers/HeadersHandler';
import Log from '@secret-agent/commons/Logger';
import CookieHandler from '../handlers/CookieHandler';
import { URL } from 'url';
import http2Request from './http2Request';
import IHttpOrH2Response from '../interfaces/IHttpOrH2Response';
import MitmProxyResponseFilter from './MitmProxyResponseFilter';
import MitmRequestCopyStream from './MitmRequestCopyStream';
import * as net from 'net';
import RequestEmitter from '../handlers/RequestEmitter';
import https from 'https';
import SocketConnectDriver from './SocketConnectDriver';

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

    const ctx = this.createContext('http', isSSL, clientRequest, clientResponse);
    if (!ctx) {
      clientRequest.resume();
      clientResponse.writeHead(400, {
        'Content-Type': 'text/html; charset=utf-8',
      });
      clientResponse.end('Bad request: Host missing...', 'UTF-8');
      return;
    }

    clientResponse.on('error', this.handleError.bind(this, 'PROXY_TO_CLIENT_RESPONSE_ERROR', ctx));

    try {
      if (!(await this.makeProxyToServerRequest(ctx, false))) {
        return;
      }

      const serverRequestStream = new MitmRequestCopyStream(
        ctx.proxyToServerRequest,
        ctx,
        this.handleError.bind(this, 'ON_REQUEST_DATA_ERROR'),
      );
      clientRequest.pipe(serverRequestStream);
      clientRequest.resume();
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

    const ctx = this.createContext('ws', isSSL, upgradeRequest);

    try {
      clientSocket.on(
        'error',
        this.handleError.bind(this, 'CLIENT_TO_PROXY_UPGRADE_SOCKET_ERROR', ctx),
      );
      const socketConnection = await this.makeProxyToServerRequest(ctx, true);
      if (!socketConnection) {
        return;
      }

      ctx.proxyToServerRequest.on(
        'upgrade',
        this.upgradeResponseHandler.bind(this, ctx, clientSocket, clientHead, socketConnection),
      );
      ctx.proxyToServerRequest.end();
    } catch (err) {
      this.handleError('ON_UPGRADE_ERROR', ctx, err);
    }
  }

  private async upgradeResponseHandler(
    ctx: IMitmRequestContext,
    clientSocket: net.Socket,
    clientHead: Buffer,
    socketConnection: SocketConnectDriver,
    serverResponse: IncomingMessage,
    serverSocket: net.Socket,
    serverHead: Buffer,
  ) {
    serverSocket.pause();
    ctx.serverToProxyResponse = serverResponse;
    ctx.serverToProxyResponse.responseTime = new Date();

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
      if (clientHead.length) clientSocket.unshift(clientHead);

      serverSocket.setNoDelay(true);
      serverSocket.setTimeout(0);
      if (serverHead.length > 0) serverSocket.unshift(serverHead);
    }

    serverSocket.pipe(clientSocket);
    clientSocket.pipe(serverSocket);

    serverSocket.resume();
    clientSocket.resume();
    RequestEmitter.emitHttpResponse(ctx, ctx.cacheHandler.buffer);
  }

  private async responseHandler(
    ctx: IMitmRequestContext,
    serverToProxyResponse: IHttpOrH2Response,
  ) {
    serverToProxyResponse.responseTime = new Date();
    ctx.serverToProxyResponse = serverToProxyResponse;
    serverToProxyResponse.on(
      'error',
      this.handleError.bind(this, 'SERVER_TO_PROXY_RESPONSE_ERROR', ctx),
    );
    serverToProxyResponse.pause();

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

    if (ctx.proxyToClientResponse) {
      ctx.proxyToClientResponse.writeHead(
        serverToProxyResponse.statusCode,
        filterAndCanonizeHeaders(serverToProxyResponse.rawHeaders),
      );
      const filter = new MitmProxyResponseFilter(
        ctx.proxyToClientResponse,
        ctx,
        this.handleError.bind(this, 'ON_RESPONSE_DATA_ERROR'),
      );
      serverToProxyResponse.pipe(filter);
    }
    serverToProxyResponse.resume();
  }

  private createContext(
    protocol: string,
    isSSL: boolean,
    clientRequest: IncomingMessage,
    clientResponse?: ServerResponse,
  ) {
    const hostPort = parseHostAndPort(clientRequest, isSSL ? 443 : 80);
    if (hostPort === null) return;

    const url = new URL(
      clientRequest.url ?? '/',
      `${protocol}${isSSL ? 's' : ''}://${hostPort.host}:${hostPort.port}`,
    );

    const headers = parseRawHeaders(clientRequest.rawHeaders);
    const ctx: IMitmRequestContext = {
      isSSL: isSSL,
      isHttp2: false,
      url: url.href,
      clientToProxyRequest: clientRequest,
      proxyToClientResponse: clientResponse,
      responseContentPotentiallyModified: false,
      requestTime: new Date(),
      cacheHandler: new CacheHandler(this.responseCache),
      documentUrl: clientRequest.headers.origin as string,
      originType: RequestSession.getOriginType(url.href, headers),
      proxyToServerRequestSettings: {
        method: clientRequest.method,
        path: clientRequest.url,
        host: hostPort.host,
        port: hostPort.port,
        headers,
        agent: null,
      },
      didBlockResource: false,
    };
    return ctx;
  }

  private async makeProxyToServerRequest(ctx: IMitmRequestContext, isUpgrade: boolean) {
    try {
      ctx.clientToProxyRequest.on(
        'error',
        this.handleError.bind(this, 'CLIENT_TO_PROXY_REQUEST_ERROR', ctx),
      );

      const requestSettings = ctx.proxyToServerRequestSettings;
      const session = (ctx.requestSession = await RequestSession.getSession(
        requestSettings.headers,
        requestSettings.method,
        isUpgrade,
        isUpgrade ? 10e3 : undefined,
      ));

      if (!session) {
        log.error('Mitm.RequestHandler:NoSessionForRequest', {
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

      session.emit('request', { request: ctx.clientToProxyRequest });

      if (BlockHandler.shouldBlockRequest(session, ctx)) {
        // already wrote reply
        return;
      }

      if (isUpgrade) {
        ctx.resourceType = 'Websocket';
      }

      await HeadersHandler.waitForResource(ctx);
      await CookieHandler.setProxyToServerCookies(ctx);

      log.info(`Mitm.handleRequest`, {
        url: ctx.url,
        hasSession: !!session,
        isSSL: ctx.isSSL,
        isUpgrade,
      });
      ctx.cacheHandler?.onRequest(ctx);

      await HeadersHandler.modifyHeaders(ctx, ctx.clientToProxyRequest);
      cleanMitmHeaders(ctx.proxyToServerRequestSettings.headers);

      const connectResult = await SocketHandler.connect(
        ctx.isSSL,
        session,
        requestSettings,
        isUpgrade,
      );
      ctx.isHttp2 = connectResult.isHttp2();
      ctx.localAddress = connectResult.localAddress;
      ctx.remoteAddress = connectResult.remoteAddress;

      const responseCallback = this.responseHandler.bind(this, ctx);
      if (ctx.isHttp2) {
        ctx.proxyToServerRequest = http2Request(
          requestSettings,
          session,
          new URL(ctx.url),
          responseCallback,
        );
      } else {
        const httpModule = ctx.isSSL ? https : http;
        ctx.proxyToServerRequest = httpModule.request(requestSettings, responseCallback);
      }
      ctx.proxyToServerRequest.on(
        'error',
        this.handleError.bind(this, 'PROXY_TO_SERVER_REQUEST_ERROR', ctx),
      );

      return connectResult;
    } catch (err) {
      this.handleError('PROXY_TO_SERVER_REQUEST_ERROR', ctx, err);
    }
  }
}

export const redirectCodes = new Set([300, 301, 302, 303, 305, 307, 308]);
