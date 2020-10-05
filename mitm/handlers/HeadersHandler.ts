// @ts-ignore
import nodeCommon from '_http_common';
import IResourceHeaders from '@secret-agent/core-interfaces/IResourceHeaders';
import Log from '@secret-agent/commons/Logger';
import * as http from 'http';
import { parseRawHeaders } from '../lib/Utils';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';

const { log } = Log(module);
export default class HeadersHandler {
  public static async waitForBrowserRequest(ctx: IMitmRequestContext) {
    const session = ctx.requestSession;

    const { method, requestHeaders } = ctx;

    if (ctx.resourceType === 'Websocket') {
      ctx.browserRequestId = await session.getWebsocketUpgradeRequestId(requestHeaders);
    } else {
      const resource = await session.waitForBrowserResourceRequest(ctx);

      if (!resource.resourceType) {
        log.error('HeadersHandler.ErrorGettingResourceType', {
          sessionId: ctx.requestSession.sessionId,
          resource,
          url: ctx.url,
        });
        throw Error('No resource type found for resource');
      }
      ctx.browserRequestId = resource.browserRequestId;
      ctx.resourceType = resource.resourceType;
      if (method === 'OPTIONS') {
        ctx.resourceType = 'Preflight';
      }
      ctx.originType = resource.originType;
      ctx.hasUserGesture = resource.hasUserGesture;
      ctx.isUserNavigation = resource.isUserNavigation;
      ctx.documentUrl = resource.documentUrl;
      if (session.delegate?.documentHasUserActivity) {
        const hasUserActivity = !!ctx.requestLowerHeaders['sec-fetch-user'];
        if (hasUserActivity) {
          await session.delegate?.documentHasUserActivity(resource.documentUrl);
        }
      }
    }
  }

  public static modifyHeaders(ctx: IMitmRequestContext) {
    const session = ctx.requestSession;
    if (session.delegate?.modifyHeadersBeforeSend) {
      const updatedHeaders = session.delegate.modifyHeadersBeforeSend({
        method: ctx.method,
        resourceType: ctx.resourceType,
        isClientHttp2: ctx.isClientHttp2,
        isSSL: ctx.isSSL,
        isServerHttp2: ctx.isServerHttp2,
        originType: ctx.originType,
        sessionId: session.sessionId,
        headers: ctx.requestHeaders,
        lowerHeaders: ctx.requestLowerHeaders,
      });
      if (updatedHeaders) ctx.requestHeaders = updatedHeaders;
    }
    this.cleanRequestHeaders(ctx);
  }

  public static cleanResponseHeaders(
    ctx: IMitmRequestContext,
    originalRawHeaders: IResourceHeaders,
  ) {
    const headers: { [name: string]: string | string[] } = {};
    for (const [key, value] of Object.entries(originalRawHeaders)) {
      const canonizedKey = key.trim();
      if (
        // HPKP header => filter
        /^public-key-pins/i.test(canonizedKey) ||
        // H2 status not allowed twice - we re-add
        /^:status/i.test(canonizedKey) ||
        /^http2-settings/i.test(canonizedKey)
      ) {
        continue;
      }
      // if going h2->h1->h2, strip http1 headers before responding to client
      if (ctx.isServerHttp2 === false && ctx.isClientHttp2) {
        if (stripHttp1HeadersForH2.includes(canonizedKey.toLowerCase())) {
          continue;
        }
      }
      // if going h1->h2->h1, clean pseudo headers
      if (ctx.isServerHttp2 && ctx.isClientHttp2 === false) {
        if (canonizedKey[0] === ':') delete ctx.responseHeaders[key];
      }

      if (!nodeCommon._checkInvalidHeaderChar(value)) {
        if (Array.isArray(value)) {
          headers[canonizedKey] = [...value];
        } else {
          headers[canonizedKey] = value;
        }
      }
    }

    return headers;
  }

  public static sendRequestTrailers(ctx: IMitmRequestContext) {
    const clientRequest = ctx.clientToProxyRequest;
    if (!clientRequest.trailers) return;

    const trailers = parseRawHeaders(clientRequest.rawTrailers);
    ctx.requestTrailers = trailers;

    if (ctx.proxyToServerRequest instanceof http.ClientRequest) {
      ctx.proxyToServerRequest.addTrailers(trailers ?? {});
    } else {
      const stream = ctx.proxyToServerRequest;
      stream.on('wantTrailers', () => {
        stream.sendTrailers(trailers ?? {});
      });
    }
  }

  public static prepareRequestHeadersForHttp2(ctx: IMitmRequestContext) {
    const url = ctx.url;

    if (!ctx.requestHeaders[':path']) ctx.requestHeaders[':path'] = url.pathname + url.search;
    if (!ctx.requestHeaders[':authority'])
      ctx.requestHeaders[':authority'] = ctx.requestLowerHeaders.host;
    if (!ctx.requestHeaders[':scheme']) ctx.requestHeaders[':scheme'] = 'https';
    if (!ctx.requestHeaders[':method']) ctx.requestHeaders[':method'] = ctx.method;

    this.stripHttp1HeadersForHttp2(ctx);
  }

  public static stripHttp1HeadersForHttp2(ctx: IMitmRequestContext) {
    // TODO: should be part of an emulator for h2 headers
    for (const key of Object.keys(ctx.requestHeaders)) {
      const lowerKey = key.toLowerCase();
      if (stripHttp1HeadersForH2.includes(lowerKey)) {
        delete ctx.requestHeaders[key];
      }
    }
  }

  private static cleanRequestHeaders(ctx: IMitmRequestContext) {
    const headers = ctx.requestHeaders;
    const removeH2Headers = ctx.isServerHttp2 === false && ctx.isClientHttp2 === true;
    for (const header of Object.keys(headers)) {
      if (removeH2Headers && header[0] === ':') {
        delete headers[header];
      }
      if (/^proxy-/i.test(header) || /^mitm-/i.test(header)) {
        delete headers[header];
      }
    }
  }
}

const stripHttp1HeadersForH2 = [
  'connection',
  'host',
  'keep-alive',
  'transfer-encoding',
  'via',
  'proxy-connection',
  'forwarded',
];
