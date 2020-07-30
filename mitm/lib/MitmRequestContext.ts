import OriginType, { isOriginType } from '@secret-agent/commons/interfaces/OriginType';
import { URL } from 'url';
import { IncomingMessage, ServerResponse } from 'http';
import { parseHostAndPort, parseRawHeaders } from './Utils';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import CacheHandler from '../handlers/CacheHandler';
import IResourceRequest from '@secret-agent/core-interfaces/IResourceRequest';
import MitmSocket from '@secret-agent/mitm-socket';
import { TLSSocket } from 'tls';
import { IRequestSessionResponseEvent } from '../handlers/RequestSession';

export default class MitmRequestContext {
  private static contextIdCounter = 0;

  public static create(
    cacheHandler: CacheHandler,
    protocol: 'ws' | 'http',
    isSSL: boolean,
    clientRequest: IncomingMessage,
    clientResponse?: ServerResponse,
  ) {
    const hostPort = parseHostAndPort(clientRequest, isSSL ? 443 : 80);
    if (hostPort === null) {
      if (clientRequest.isPaused()) clientRequest.resume();
      clientResponse.writeHead(400, {
        'Content-Type': 'text/html; charset=utf-8',
      });
      clientResponse.end('Bad request: Host missing...');
      return;
    }

    const url = new URL(
      clientRequest.url ?? '/',
      `${protocol}${isSSL ? 's' : ''}://${hostPort.host}:${hostPort.port}`,
    );

    const headers = parseRawHeaders(clientRequest.rawHeaders);
    const ctx: IMitmRequestContext = {
      id: this.contextIdCounter += 1,
      isSSL: isSSL,
      isUpgrade: protocol === 'ws',
      isHttp2: false,
      url: url.href,
      origin: url.origin,
      clientToProxyRequest: clientRequest,
      proxyToClientResponse: clientResponse,
      responseContentPotentiallyModified: false,
      requestTime: new Date(),
      cacheHandler,
      documentUrl: clientRequest.headers.origin as string,
      originType: this.getOriginType(url.href, headers),
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

    if (protocol === 'ws') {
      ctx.resourceType = 'Websocket';
    }

    return ctx;
  }

  public static toEmittedResource(ctx: IMitmRequestContext): IRequestSessionResponseEvent {
    // broadcast session
    const request = {
      url: ctx.url,
      headers: ctx.proxyToServerRequestSettings.headers,
      method: ctx.clientToProxyRequest.method,
      postData: ctx.postData,
      timestamp: ctx.requestTime.toISOString(),
    } as IResourceRequest;

    return {
      id: ctx.id,
      browserRequestId: ctx.browserRequestId,
      request,
      response: ctx.serverToProxyResponse,
      wasCached: ctx.cacheHandler.didUseArtificialCache,
      resourceType: ctx.resourceType,
      remoteAddress: ctx.remoteAddress,
      requestTime: ctx.requestTime,
      body: ctx.cacheHandler.buffer,
      localAddress: ctx.localAddress,
      originalHeaders: parseRawHeaders(ctx.clientToProxyRequest.rawHeaders),
      clientAlpn: (ctx.clientToProxyRequest.socket as TLSSocket)?.alpnProtocol ?? 'http/1.1',
      serverAlpn: ctx.proxyToServerSocket?.alpn,
    };
  }

  public static assignMitmSocket(ctx: IMitmRequestContext, mitmSocket: MitmSocket) {
    ctx.proxyToServerSocket = mitmSocket;
    ctx.isHttp2 = mitmSocket.isHttp2();
    ctx.localAddress = mitmSocket.localAddress;
    ctx.remoteAddress = mitmSocket.remoteAddress;
  }

  public static getOriginType(url: string, headers: { [name: string]: string }): OriginType {
    if (isOriginType(headers['Sec-Fetch-Site'])) {
      return headers['Sec-Fetch-Site'] as OriginType;
    }

    let origin = headers.Origin ?? headers.origin;
    if (!origin) {
      const referer = headers.Referer ?? headers.referer;
      if (referer) origin = new URL(referer).origin;
    }
    let originType: OriginType = 'none';
    if (origin) {
      const urlOrigin = new URL(url).origin;
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
}
