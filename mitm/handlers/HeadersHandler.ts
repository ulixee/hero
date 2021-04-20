// @ts-ignore
import * as nodeCommon from '_http_common';
import IResourceHeaders from '@secret-agent/core-interfaces/IResourceHeaders';
import * as http from 'http';
import * as http2 from 'http2';
import OriginType from '@secret-agent/core-interfaces/OriginType';
import ResourceType from '@secret-agent/core-interfaces/ResourceType';
import { URL } from 'url';
import IHttpResourceLoadDetails from '@secret-agent/core-interfaces/IHttpResourceLoadDetails';
import { parseRawHeaders } from '../lib/Utils';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import ResourceState from '../interfaces/ResourceState';

const redirectCodes = new Set([300, 301, 302, 303, 305, 307, 308]);

const {
  HTTP2_HEADER_PATH,
  HTTP2_HEADER_STATUS,
  HTTP2_HEADER_AUTHORITY,
  HTTP2_HEADER_SCHEME,
  HTTP2_HEADER_METHOD,
} = http2.constants;

const SecFetchDest = 'sec-fetch-dest';
const SecFetchSite = 'sec-fetch-site';
const SecFetchUser = 'sec-fetch-user';
const SecFetchMode = 'sec-fetch-mode';
const PublicKeyPins = 'public-key-pins';
const Http2Settings = 'http2-settings';

export default class HeadersHandler {
  public static async determineResourceType(ctx: IMitmRequestContext): Promise<void> {
    ctx.setState(ResourceState.DetermineResourceType);
    const session = ctx.requestSession;

    const { method, requestHeaders } = ctx;

    const fetchDest = this.getRequestHeader<string>(ctx, SecFetchDest);
    const fetchSite = this.getRequestHeader<string>(ctx, SecFetchSite);
    const fetchMode = this.getRequestHeader<string>(ctx, SecFetchMode);
    const hasUserActivity = this.getRequestHeader<string>(ctx, SecFetchUser);
    const isDocumentNavigation = fetchMode === 'navigate' && fetchDest === 'document';

    // fill in known details
    if (fetchSite) ctx.originType = fetchSite as OriginType;

    if (fetchDest) ctx.resourceType = resourceTypesBySecFetchDest.get(fetchDest as string);
    if (method === 'OPTIONS') ctx.resourceType = 'Preflight';

    if (hasUserActivity === '?1') ctx.hasUserGesture = true;
    if (fetchMode) ctx.isUserNavigation = isDocumentNavigation && ctx.hasUserGesture;

    const requestedResource = session.browserRequestMatcher.onMitmRequestedResource(ctx);

    if (ctx.resourceType === 'Websocket') {
      ctx.browserRequestId = await session.getWebsocketUpgradeRequestId(requestHeaders);
      requestedResource.browserRequestedPromise.resolve(null);
    } else if (!ctx.resourceType) {
      await ctx.browserHasRequested;
    }
  }

  public static getRequestHeader<T = string | string[]>(
    ctx: IHttpResourceLoadDetails,
    name: string,
  ): T {
    const lowerName = name.toLowerCase();
    const exactMatch = ctx.requestHeaders[name] ?? ctx.requestHeaders[lowerName];
    if (exactMatch) return exactMatch as any;
    for (const [key, value] of Object.entries(ctx.requestHeaders)) {
      if (key.toLowerCase() === lowerName) {
        return value as any;
      }
    }
  }

  public static cleanResponseHeaders(
    ctx: IMitmRequestContext,
    originalRawHeaders: IResourceHeaders,
  ): IResourceHeaders {
    const headers: IResourceHeaders = {};
    for (const [headerName, value] of Object.entries(originalRawHeaders)) {
      if (nodeCommon._checkInvalidHeaderChar(value)) continue;

      const canonizedKey = headerName.trim();

      // if going h1->h2->h1, clean pseudo headers
      if (ctx.isServerHttp2 && ctx.isClientHttp2 === false) {
        if (canonizedKey[0] === ':') continue;
      }

      const lowerHeaderName = canonizedKey.toLowerCase();
      if (
        // HPKP header => filter
        lowerHeaderName === PublicKeyPins ||
        // H2 status not allowed twice - we re-add
        lowerHeaderName === HTTP2_HEADER_STATUS ||
        lowerHeaderName === Http2Settings
      ) {
        continue;
      }
      // if going h2->h1->h2, strip http1 headers before responding to client
      if (ctx.isClientHttp2 && stripHttp1HeadersForH2.has(lowerHeaderName)) {
        continue;
      }

      if (Array.isArray(value)) {
        if (singleValueHttp2Headers.has(lowerHeaderName)) {
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

  public static checkForRedirectResponseLocation(context: IMitmRequestContext): URL {
    if (redirectCodes.has(context.status)) {
      const redirectLocation = context.responseHeaders.location || context.responseHeaders.Location;
      if (redirectLocation) {
        return new URL(redirectLocation as string, context.url);
      }
    }
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
      if (!ctx.requestHeaders[HTTP2_HEADER_PATH])
        ctx.requestHeaders[HTTP2_HEADER_PATH] = url.pathname + url.search;
      if (!ctx.requestHeaders[HTTP2_HEADER_AUTHORITY])
        ctx.requestHeaders[HTTP2_HEADER_AUTHORITY] = this.getRequestHeader<string>(ctx, 'host');
      if (!ctx.requestHeaders[HTTP2_HEADER_SCHEME])
        ctx.requestHeaders[HTTP2_HEADER_SCHEME] = 'https';
      if (!ctx.requestHeaders[HTTP2_HEADER_METHOD])
        ctx.requestHeaders[HTTP2_HEADER_METHOD] = ctx.method;
    }

    this.stripHttp1HeadersForHttp2(ctx);
  }

  public static stripHttp1HeadersForHttp2(ctx: IMitmRequestContext): void {
    // TODO: should be part of an emulator for h2 headers
    for (const key of Object.keys(ctx.requestHeaders)) {
      const lowerKey = key.toLowerCase();
      if (stripHttp1HeadersForH2.has(lowerKey) || startsWithProxyRegex.test(key)) {
        delete ctx.requestHeaders[key];
      }
      if (singleValueHttp2Headers.has(lowerKey)) {
        const value = ctx.requestHeaders[key];
        if (Array.isArray(value) && value.length) {
          ctx.requestHeaders[key] = value[0];
        }
      }
    }
  }

  public static cleanHttp1RequestHeaders(ctx: IMitmRequestContext): void {
    const headers = ctx.requestHeaders;
    const removeH2Headers = ctx.isServerHttp2 === false && ctx.isClientHttp2 === true;
    for (const header of Object.keys(headers)) {
      if (removeH2Headers && header[0] === ':') {
        delete headers[header];
      }
      if (startsWithProxyRegex.test(header)) {
        delete headers[header];
      }
    }
  }
}

const startsWithProxyRegex = /^proxy-/i;

const resourceTypesBySecFetchDest = new Map<string, ResourceType>([
  ['document', 'Document'],
  ['nested-document', 'Document'],
  ['iframe', 'Document'],

  ['style', 'Stylesheet'],
  ['xslt', 'Stylesheet'], // not sure where this one goes
  ['script', 'Script'],

  ['empty', 'Fetch'],
  ['font', 'Font'],
  ['image', 'Image'],
  ['video', 'Media'],
  ['audio', 'Media'],
  ['paintworklet', 'Media'], // guess
  ['audioworklet', 'Media'], // guess
  ['manifest', 'Manifest'],
  ['embed', 'Other'], // guess
  ['object', 'Other'], // guess
  ['report', 'CSP Violation Report'],
  ['worker', 'Other'], // guess
  ['serviceworker', 'Other'],
  ['sharedworker', 'Other'],
  ['track', 'Text Track'], // guess
]);

const stripHttp1HeadersForH2 = new Set([
  http2.constants.HTTP2_HEADER_CONNECTION,
  http2.constants.HTTP2_HEADER_UPGRADE,
  http2.constants.HTTP2_HEADER_HTTP2_SETTINGS,
  http2.constants.HTTP2_HEADER_KEEP_ALIVE,
  http2.constants.HTTP2_HEADER_PROXY_CONNECTION,
  http2.constants.HTTP2_HEADER_TRANSFER_ENCODING,
  'host',
  'via',
  'forwarded',
]);
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
