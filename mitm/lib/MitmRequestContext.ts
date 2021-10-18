import { URL } from 'url';
import * as http from 'http';
import * as http2 from 'http2';
import IResourceRequest from '@ulixee/hero-interfaces/IResourceRequest';
import { TLSSocket } from 'tls';
import MitmSocket from '@ulixee/hero-mitm-socket';
import OriginType, { isOriginType } from '@ulixee/hero-interfaces/OriginType';
import IResourceHeaders from '@ulixee/hero-interfaces/IResourceHeaders';
import IResourceResponse from '@ulixee/hero-interfaces/IResourceResponse';
import { IPuppetResourceRequest } from '@ulixee/hero-interfaces/IPuppetNetworkEvents';
import HttpResponseCache from './HttpResponseCache';
import HeadersHandler from '../handlers/HeadersHandler';
import { IRequestSessionResponseEvent } from '../handlers/RequestSession';
import CacheHandler from '../handlers/CacheHandler';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import { parseRawHeaders } from './Utils';
import ResourceState from '../interfaces/ResourceState';

export default class MitmRequestContext {
  private static contextIdCounter = 0;

  public static createFromPuppetResourceRequest(
    resourceLoadDetails: IPuppetResourceRequest,
  ): IMitmRequestContext {
    return {
      id: (this.contextIdCounter += 1),
      ...resourceLoadDetails,
      requestOriginalHeaders: { ...resourceLoadDetails.requestHeaders },
      didBlockResource: !!resourceLoadDetails.browserBlockedReason,
      cacheHandler: null,
      clientToProxyRequest: null,
      stateChanges: new Map<ResourceState, Date>([[ResourceState.End, new Date()]]),
      setState() {},
    };
  }

  public static create(
    params: Pick<
      IMitmRequestContext,
      'requestSession' | 'isSSL' | 'clientToProxyRequest' | 'proxyToClientResponse' | 'isUpgrade'
    >,
    responseCache: HttpResponseCache,
  ): IMitmRequestContext {
    const { isSSL, proxyToClientResponse, clientToProxyRequest, requestSession, isUpgrade } =
      params;

    const protocol = isUpgrade ? 'ws' : 'http';
    const expectedProtocol = `${protocol}${isSSL ? 's' : ''}:`;

    let url: URL;
    if (
      clientToProxyRequest.url.startsWith('http://') ||
      clientToProxyRequest.url.startsWith('https://') ||
      clientToProxyRequest.url.startsWith('ws://') ||
      clientToProxyRequest.url.startsWith('wss://')
    ) {
      url = new URL(clientToProxyRequest.url);
    } else {
      let providedHost = (clientToProxyRequest.headers.host ??
        clientToProxyRequest.headers[':authority'] ??
        '') as string;
      if (providedHost.endsWith('/')) providedHost = providedHost.slice(0, -1);
      if (
        providedHost.startsWith('http://') ||
        providedHost.startsWith('https://') ||
        providedHost.startsWith('ws://') ||
        providedHost.startsWith('wss://')
      ) {
        providedHost = providedHost.split('://').slice(1).join('://');
      }
      // build urls in two steps because URL constructor will bomb on valid WHATWG urls with path
      url = new URL(`${expectedProtocol}//${providedHost}${clientToProxyRequest.url}`);
    }

    if (url.protocol !== expectedProtocol) {
      url.protocol = expectedProtocol;
    }
    const state = new Map<ResourceState, Date>();
    const requestHeaders = parseRawHeaders(clientToProxyRequest.rawHeaders);
    const ctx: IMitmRequestContext = {
      id: (this.contextIdCounter += 1),
      isSSL,
      isUpgrade,
      isServerHttp2: false,
      isHttp2Push: false,
      method: clientToProxyRequest.method,
      url,
      requestSession,
      requestHeaders,
      requestOriginalHeaders: parseRawHeaders(clientToProxyRequest.rawHeaders),
      clientToProxyRequest,
      proxyToClientResponse,
      requestTime: Date.now(),
      protocol: (clientToProxyRequest.socket as TLSSocket)?.alpnProtocol || 'http/1.1',
      documentUrl: clientToProxyRequest.headers.origin as string,
      originType: this.getOriginType(url, requestHeaders),
      didBlockResource: false,
      cacheHandler: null,
      stateChanges: state,
      setState(stateStep: ResourceState) {
        state.set(stateStep, new Date());
        requestSession.emit('resource-state', { context: ctx, state: stateStep });
      },
    };

    if (protocol === 'ws') {
      ctx.resourceType = 'Websocket';
    }

    ctx.cacheHandler = new CacheHandler(responseCache, ctx);
    return ctx;
  }

  public static createFromHttp2Push(
    parentContext: IMitmRequestContext,
    rawHeaders: string[],
  ): IMitmRequestContext {
    const requestHeaders = parseRawHeaders(rawHeaders);
    const url = new URL(
      `${parentContext.url.protocol}//${requestHeaders[':authority']}${requestHeaders[':path']}`,
    );
    const state = new Map<ResourceState, Date>();
    const ctx = {
      id: (this.contextIdCounter += 1),
      url,
      method: requestHeaders[':method'],
      isServerHttp2: parentContext.isServerHttp2,
      requestSession: parentContext.requestSession,
      protocol: parentContext.protocol,
      remoteAddress: parentContext.remoteAddress,
      localAddress: parentContext.localAddress,
      originType: parentContext.originType,
      isUpgrade: false,
      isSSL: parentContext.isSSL,
      hasUserGesture: parentContext.hasUserGesture,
      isHttp2Push: true,
      requestOriginalHeaders: parseRawHeaders(rawHeaders),
      requestHeaders,
      responseHeaders: null,
      responseUrl: null,
      responseTrailers: null,
      clientToProxyRequest: null,
      proxyToClientResponse: null,
      serverToProxyResponseStream: null,
      proxyToServerRequest: null,
      requestTime: Date.now(),
      didBlockResource: false,
      cacheHandler: null,
      stateChanges: state,
      setState(stateStep: ResourceState) {
        state.set(stateStep, new Date());
        parentContext.requestSession.emit('resource-state', { context: ctx, state: stateStep });
      },
    } as IMitmRequestContext;

    ctx.cacheHandler = new CacheHandler(parentContext.cacheHandler.responseCache, ctx);
    return ctx;
  }

  public static toEmittedResource(ctx: IMitmRequestContext): IRequestSessionResponseEvent {
    const request = {
      url: ctx.url?.href,
      headers: ctx.requestHeaders,
      method: ctx.method,
      postData: ctx.requestPostData,
      timestamp: ctx.requestTime,
    } as IResourceRequest;

    const response = {
      url: ctx.responseUrl,
      statusCode: ctx.originalStatus ?? ctx.status,
      statusMessage: ctx.statusMessage,
      headers: ctx.responseHeaders,
      trailers: ctx.responseTrailers,
      timestamp: ctx.responseTime,
      browserServedFromCache: ctx.browserServedFromCache,
      browserLoadFailure: ctx.browserLoadFailure,
      browserLoadedTime: ctx.browserLoadedTime,
      remoteAddress: ctx.remoteAddress,
    } as IResourceResponse;

    return {
      id: ctx.id,
      browserRequestId: ctx.browserRequestId,
      frameId: ctx.browserFrameId,
      request,
      response,
      redirectedToUrl: ctx.redirectedToUrl,
      wasCached: ctx.cacheHandler?.didProposeCachedResource ?? false,
      resourceType: ctx.resourceType,
      body: ctx.cacheHandler?.buffer,
      localAddress: ctx.localAddress,
      dnsResolvedIp: ctx.dnsResolvedIp,
      originalHeaders: ctx.requestOriginalHeaders,
      responseOriginalHeaders: ctx.responseOriginalHeaders,
      socketId: ctx.proxyToServerMitmSocket?.id,
      protocol: ctx.protocol,
      serverAlpn: ctx.proxyToServerMitmSocket?.alpn,
      didBlockResource: ctx.didBlockResource,
      executionMillis: (ctx.responseTime ?? Date.now()) - ctx.requestTime,
      isHttp2Push: ctx.isHttp2Push,
      browserBlockedReason: ctx.browserBlockedReason,
      browserCanceled: ctx.browserCanceled,
    };
  }

  public static assignMitmSocket(ctx: IMitmRequestContext, mitmSocket: MitmSocket): void {
    ctx.proxyToServerMitmSocket = mitmSocket;
    ctx.dnsResolvedIp = mitmSocket.dnsResolvedIp;
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

  public static readHttp1Response(ctx: IMitmRequestContext, response: http.IncomingMessage): void {
    ctx.status = response.statusCode;
    ctx.originalStatus = response.statusCode;
    ctx.statusMessage = response.statusMessage;

    ctx.responseUrl = response.url;
    ctx.responseTime = Date.now();
    ctx.serverToProxyResponse = response;
    ctx.responseOriginalHeaders = parseRawHeaders(response.rawHeaders);
    ctx.responseHeaders = HeadersHandler.cleanResponseHeaders(ctx, ctx.responseOriginalHeaders);

    const redirectUrl = HeadersHandler.checkForRedirectResponseLocation(ctx);
    if (redirectUrl) {
      ctx.redirectedToUrl = redirectUrl.href;
      ctx.responseUrl = ctx.redirectedToUrl;
    }
  }

  public static readHttp2Response(
    ctx: IMitmRequestContext,
    response: http2.ClientHttp2Stream,
    statusCode: number,
    rawHeaders: string[],
  ): void {
    const headers = parseRawHeaders(rawHeaders);
    ctx.status = statusCode;
    ctx.originalStatus = statusCode;
    ctx.responseTime = Date.now();
    ctx.serverToProxyResponse = response;
    ctx.responseOriginalHeaders = headers;
    ctx.responseHeaders = HeadersHandler.cleanResponseHeaders(ctx, headers);

    const redirectUrl = HeadersHandler.checkForRedirectResponseLocation(ctx);
    if (redirectUrl) {
      ctx.redirectedToUrl = redirectUrl.href;
      ctx.responseUrl = ctx.redirectedToUrl;
    }
  }
}
