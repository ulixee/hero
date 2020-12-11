// @ts-ignore
import nodeCommon from '_http_common';
import IResourceHeaders from '@secret-agent/core-interfaces/IResourceHeaders';
import Log from '@secret-agent/commons/Logger';
import * as http from 'http';
import http2 from 'http2';
import OriginType from '@secret-agent/core-interfaces/OriginType';
import { parseRawHeaders } from '../lib/Utils';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import ResourceState from '../interfaces/ResourceState';

const { log } = Log(module);
export default class HeadersHandler {
  public static async waitForBrowserRequest(ctx: IMitmRequestContext): Promise<void> {
    ctx.setState(ResourceState.WaitForBrowserRequest);
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
      ctx.originType = resource.originType as OriginType;
      ctx.hasUserGesture = resource.hasUserGesture;
      ctx.isUserNavigation = resource.isUserNavigation;
      ctx.documentUrl = resource.documentUrl;
      if (session.networkInterceptorDelegate?.http.onOriginHasFirstPartyInteraction) {
        const hasUserActivity = !!ctx.requestLowerHeaders['sec-fetch-user'];
        if (hasUserActivity) {
          await session.networkInterceptorDelegate.http.onOriginHasFirstPartyInteraction(
            resource.documentUrl,
          );
        }
      }
    }
  }

  public static modifyHeaders(ctx: IMitmRequestContext): void {
    ctx.setState(ResourceState.ModifyHeaders);
    const session = ctx.requestSession;
    if (ctx.isServerHttp2 === false && !ctx.requestLowerHeaders.host) {
      ctx.requestHeaders.Host = ctx.url.host;
      ctx.requestLowerHeaders.host = ctx.url.host;
    }
    if (session.networkInterceptorDelegate?.http.requestHeaders) {
      const updatedHeaders = session.networkInterceptorDelegate.http.requestHeaders({
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
  ): IResourceHeaders {
    const headers: IResourceHeaders = {};
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

      if (nodeCommon._checkInvalidHeaderChar(value)) continue;

      if (Array.isArray(value)) {
        if (singleValueHttp2Headers.has(key)) {
          headers[canonizedKey] = value[0];
        } else {
          headers[canonizedKey] = [...value];
        }
      } else {
        headers[canonizedKey] = value;
      }
    }

    return headers;
  }

  public static sendRequestTrailers(ctx: IMitmRequestContext): void {
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

  public static prepareRequestHeadersForHttp2(ctx: IMitmRequestContext): void {
    const url = ctx.url;
    if (ctx.isServerHttp2 && ctx.isClientHttp2 === false) {
      if (!ctx.requestHeaders[':path']) ctx.requestHeaders[':path'] = url.pathname + url.search;
      if (!ctx.requestHeaders[':authority'])
        ctx.requestHeaders[':authority'] = ctx.requestLowerHeaders.host;
      if (!ctx.requestHeaders[':scheme']) ctx.requestHeaders[':scheme'] = 'https';
      if (!ctx.requestHeaders[':method']) ctx.requestHeaders[':method'] = ctx.method;
    }

    this.stripHttp1HeadersForHttp2(ctx);
  }

  public static stripHttp1HeadersForHttp2(ctx: IMitmRequestContext): void {
    // TODO: should be part of an emulator for h2 headers
    for (const key of Object.keys(ctx.requestHeaders)) {
      const lowerKey = key.toLowerCase();
      if (stripHttp1HeadersForH2.includes(lowerKey)) {
        delete ctx.requestHeaders[key];
      }
      if (singleValueHttp2Headers.has(lowerKey)) {
        const value = ctx.requestHeaders[key];
        if (Array.isArray(value) && value.length) ctx.requestHeaders[lowerKey] = value[0];
      }
    }
  }

  private static cleanRequestHeaders(ctx: IMitmRequestContext): void {
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
  http2.constants.HTTP2_HEADER_CONNECTION,
  http2.constants.HTTP2_HEADER_UPGRADE,
  http2.constants.HTTP2_HEADER_HTTP2_SETTINGS,
  http2.constants.HTTP2_HEADER_KEEP_ALIVE,
  http2.constants.HTTP2_HEADER_PROXY_CONNECTION,
  http2.constants.HTTP2_HEADER_TRANSFER_ENCODING,
  'host',
  'via',
  'forwarded',
];
// This set contains headers that are permitted to have only a single
// value. Multiple instances must not be specified.
// NOTE: some are not exposed in constants, so we're putting strings in place
const singleValueHttp2Headers = new Set([
  http2.constants.HTTP2_HEADER_STATUS,
  http2.constants.HTTP2_HEADER_METHOD,
  http2.constants.HTTP2_HEADER_AUTHORITY,
  http2.constants.HTTP2_HEADER_SCHEME,
  http2.constants.HTTP2_HEADER_PATH,
  ':protocol',
  'access-control-allow-credentials',
  'access-control-max-age',
  'access-control-request-method',
  http2.constants.HTTP2_HEADER_AGE,
  http2.constants.HTTP2_HEADER_AUTHORIZATION,
  http2.constants.HTTP2_HEADER_CONTENT_ENCODING,
  http2.constants.HTTP2_HEADER_CONTENT_LANGUAGE,
  http2.constants.HTTP2_HEADER_CONTENT_LENGTH,
  http2.constants.HTTP2_HEADER_CONTENT_LOCATION,
  http2.constants.HTTP2_HEADER_CONTENT_MD5,
  http2.constants.HTTP2_HEADER_CONTENT_RANGE,
  http2.constants.HTTP2_HEADER_CONTENT_TYPE,
  http2.constants.HTTP2_HEADER_DATE,
  'dnt',
  http2.constants.HTTP2_HEADER_ETAG,
  http2.constants.HTTP2_HEADER_EXPIRES,
  http2.constants.HTTP2_HEADER_FROM,
  http2.constants.HTTP2_HEADER_HOST,
  http2.constants.HTTP2_HEADER_IF_MATCH,
  http2.constants.HTTP2_HEADER_IF_MODIFIED_SINCE,
  http2.constants.HTTP2_HEADER_IF_NONE_MATCH,
  http2.constants.HTTP2_HEADER_IF_RANGE,
  http2.constants.HTTP2_HEADER_IF_UNMODIFIED_SINCE,
  http2.constants.HTTP2_HEADER_LAST_MODIFIED,
  http2.constants.HTTP2_HEADER_LOCATION,
  http2.constants.HTTP2_HEADER_MAX_FORWARDS,
  http2.constants.HTTP2_HEADER_PROXY_AUTHORIZATION,
  http2.constants.HTTP2_HEADER_RANGE,
  http2.constants.HTTP2_HEADER_REFERER,
  http2.constants.HTTP2_HEADER_RETRY_AFTER,
  'tk',
  'upgrade-insecure-requests',
  http2.constants.HTTP2_HEADER_USER_AGENT,
  'x-content-type-options',
]);
