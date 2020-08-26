import { URL } from 'url';
import http, { IncomingMessage, ServerResponse } from 'http';
import * as http2 from 'http2';
import IResourceRequest from '@secret-agent/core-interfaces/IResourceRequest';
import { TLSSocket } from 'tls';
import MitmSocket from '@secret-agent/mitm-socket';
import OriginType, { isOriginType } from '@secret-agent/commons/interfaces/OriginType';
import IResourceHeaders from '@secret-agent/core-interfaces/IResourceHeaders';
import IResourceResponse from '@secret-agent/core-interfaces/IResourceResponse';
import HttpResponseCache from './HttpResponseCache';
import HeadersHandler from '../handlers/HeadersHandler';
import { IRequestSessionResponseEvent } from '../handlers/RequestSession';
import CacheHandler from '../handlers/CacheHandler';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import { parseRawHeaders } from './Utils';

export default class MitmRequestContext {
  private static contextIdCounter = 0;

  public static create(
    responseCache: HttpResponseCache,
    protocol: 'ws' | 'http',
    isSSL: boolean,
    clientRequest: IncomingMessage | http2.Http2ServerRequest,
    clientResponse?: ServerResponse | http2.Http2ServerResponse,
  ) {
    const expectedProtocol = `${protocol}${isSSL ? 's' : ''}:`;
    const providedHost = clientRequest.headers.host ?? clientRequest.headers[':authority'] ?? '';
    const url = new URL(clientRequest.url, `${expectedProtocol}//${providedHost}`);
    if (url.protocol !== expectedProtocol) {
      url.protocol = expectedProtocol;
    }

    const requestHeaders = parseRawHeaders(clientRequest.rawHeaders);
    const ctx: IMitmRequestContext = {
      id: this.contextIdCounter += 1,
      isSSL,
      isUpgrade: protocol === 'ws',
      isClientHttp2: clientRequest instanceof http2.Http2ServerRequest,
      isServerHttp2: false,
      isHttp2Push: false,
      method: clientRequest.method,
      url,
      requestHeaders,
      requestOriginalHeaders: parseRawHeaders(clientRequest.rawHeaders),
      requestLowerHeaders: { ...clientRequest.headers },
      clientToProxyRequest: clientRequest,
      proxyToClientResponse: clientResponse,
      requestTime: new Date(),
      clientAlpn: (clientRequest.socket as TLSSocket)?.alpnProtocol || 'http/1.1',
      documentUrl: clientRequest.headers.origin as string,
      originType: this.getOriginType(url, requestHeaders),
      didBlockResource: false,
      cacheHandler: null,
    };

    if (protocol === 'ws') {
      ctx.resourceType = 'Websocket';
    }

    ctx.cacheHandler = new CacheHandler(responseCache, ctx);
    return ctx;
  }

  public static createFromHttp2Push(
    parentContext: IMitmRequestContext,
    headers: http2.IncomingHttpHeaders & http2.IncomingHttpStatusHeader,
  ) {
    const url = new URL(
      `${parentContext.url.protocol}//${headers[':authority']}${headers[':path']}`,
    );
    const ctx = {
      id: this.contextIdCounter += 1,
      url,
      method: headers[':method'],
      isServerHttp2: parentContext.isServerHttp2,
      isClientHttp2: parentContext.isClientHttp2,
      requestSession: parentContext.requestSession,
      clientAlpn: parentContext.clientAlpn,
      remoteAddress: parentContext.remoteAddress,
      localAddress: parentContext.localAddress,
      originType: parentContext.originType,
      isUpgrade: false,
      isSSL: parentContext.isSSL,
      hasUserGesture: parentContext.hasUserGesture,
      isHttp2Push: true,
      requestOriginalHeaders: { ...headers },
      requestHeaders: headers,
      requestLowerHeaders: { ...headers },
      responseHeaders: null,
      responseUrl: null,
      responseTrailers: null,
      clientToProxyRequest: null,
      proxyToClientResponse: null,
      serverToProxyResponseStream: null,
      proxyToServerRequest: null,
      requestTime: new Date(),
      didBlockResource: false,
    } as IMitmRequestContext;

    ctx.cacheHandler = new CacheHandler(parentContext.cacheHandler.responseCache, ctx);
    return ctx;
  }

  public static toEmittedResource(ctx: IMitmRequestContext): IRequestSessionResponseEvent {
    const request = {
      url: ctx.url.href,
      headers: ctx.requestHeaders,
      method: ctx.method,
      postData: ctx.requestPostData,
      timestamp: ctx.requestTime.toISOString(),
    } as IResourceRequest;

    const response = {
      url: ctx.responseUrl,
      statusCode: ctx.status,
      statusMessage: ctx.statusMessage,
      headers: ctx.responseHeaders,
      trailers: ctx.responseTrailers,
      timestamp: ctx.responseTime?.toISOString(),
      remoteAddress: ctx.remoteAddress,
    } as IResourceResponse;

    return {
      id: ctx.id,
      browserRequestId: ctx.browserRequestId,
      request,
      response,
      redirectedToUrl: ctx.redirectedToUrl,
      wasCached: ctx.cacheHandler.didProposeCachedResource,
      resourceType: ctx.resourceType,
      body: ctx.cacheHandler.buffer,
      localAddress: ctx.localAddress,
      originalHeaders: ctx.requestOriginalHeaders,
      clientAlpn: ctx.clientAlpn,
      serverAlpn: ctx.proxyToServerSocket?.alpn,
      didBlockResource: ctx.didBlockResource,
      executionMillis: (ctx.responseTime ?? new Date()).getTime() - ctx.requestTime.getTime(),
      isHttp2Push: ctx.isHttp2Push,
    };
  }

  public static assignMitmSocket(ctx: IMitmRequestContext, mitmSocket: MitmSocket) {
    ctx.proxyToServerSocket = mitmSocket;
    ctx.isServerHttp2 = mitmSocket.isHttp2();
    ctx.localAddress = mitmSocket.localAddress;
    ctx.remoteAddress = mitmSocket.remoteAddress;
  }

  public static getOriginType(url: URL, headers: IResourceHeaders): OriginType {
    if (isOriginType(headers['Sec-Fetch-Site'] as string)) {
      return headers['Sec-Fetch-Site'] as OriginType;
    }

    let origin = (headers.Origin ?? headers.origin) as string;
    if (!origin) {
      const referer = (headers.Referer ?? headers.referer) as string;
      if (referer) origin = new URL(referer).origin;
    }
    let originType: OriginType = 'none';
    if (origin) {
      const urlOrigin = url.origin;
      if (urlOrigin === origin) {
        originType = 'same-origin';
      } else if (urlOrigin.includes(origin) || origin.includes(urlOrigin)) {
        originType = 'same-site';
      } else {
        originType = 'cross-site';
      }
    }
    return originType;
  }

  public static readHttp1Response(ctx: IMitmRequestContext, response: http.IncomingMessage) {
    ctx.status = response.statusCode;
    ctx.statusMessage = response.statusMessage;

    ctx.responseUrl = response.url;
    ctx.responseTime = new Date();
    ctx.responseOriginalHeaders = parseRawHeaders(response.rawHeaders);
    ctx.responseHeaders = HeadersHandler.cleanResponseHeaders(ctx, ctx.responseOriginalHeaders);
  }

  public static readHttp2Response(
    ctx: IMitmRequestContext,
    headers: http2.IncomingHttpHeaders & http2.IncomingHttpStatusHeader,
  ) {
    ctx.status = headers[':status'];
    ctx.responseTime = new Date();
    ctx.responseHeaders = HeadersHandler.cleanResponseHeaders(ctx, headers);
    ctx.responseOriginalHeaders = headers;
  }
}
