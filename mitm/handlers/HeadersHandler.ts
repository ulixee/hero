import IResourceHeaders from '@ulixee/hero-interfaces/IResourceHeaders';
import * as http from 'http';
import * as http2 from 'http2';
import OriginType from '@ulixee/hero-interfaces/OriginType';
import ResourceType from '@ulixee/hero-interfaces/ResourceType';
import { URL } from 'url';
import IHttpResourceLoadDetails from '@ulixee/hero-interfaces/IHttpResourceLoadDetails';
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
    } else if (!ctx.resourceType || ctx.resourceType === 'Fetch') {
      // if fetch, we need to wait for the browser request so we can see if we should use xhr order or fetch order
      await ctx.browserHasRequested;
    }
  }

  public static getRequestHeader<T = string | string[]>(
    ctx: Pick<IHttpResourceLoadDetails, 'requestHeaders'>,
    name: string,
  ): T {
    const lowerName = toLowerCase(name);
    const exactMatch = ctx.requestHeaders[name] ?? ctx.requestHeaders[lowerName];
    if (exactMatch) return exactMatch as any;
    for (const [key, value] of Object.entries(ctx.requestHeaders)) {
      if (toLowerCase(key) === lowerName) {
        return value as any;
      }
    }
  }

  public static isWorkerDest(
    ctx: Pick<IHttpResourceLoadDetails, 'requestHeaders'>,
    ...types: ('shared' | 'service' | 'worker')[]
  ): boolean {
    const fetchDest = HeadersHandler.getRequestHeader(ctx, 'sec-fetch-dest');
    if (types.includes('shared') && fetchDest === 'sharedworker') return true;
    if (types.includes('service') && fetchDest === 'serviceworker') return true;
    if (types.includes('worker') && fetchDest === 'worker') return true;
    return false;
  }

  public static cleanResponseHeaders(
    ctx: IMitmRequestContext,
    originalRawHeaders: IResourceHeaders,
  ): IResourceHeaders {
    const headers: IResourceHeaders = {};
    for (const [headerName, value] of Object.entries(originalRawHeaders)) {
      const canonizedKey = headerName.trim();

      const lowerHeaderName = toLowerCase(canonizedKey);
      if (
        // HPKP header => filter
        lowerHeaderName === PublicKeyPins ||
        // H2 status not allowed twice - we re-add
        lowerHeaderName === HTTP2_HEADER_STATUS ||
        lowerHeaderName === Http2Settings
      ) {
        continue;
      }

      if (Array.isArray(value)) {
        if (singleValueHttp2Headers.has(lowerHeaderName)) {
          headers[canonizedKey] = value[0];
        } else {
          headers[canonizedKey] = [...value];
          headers[canonizedKey] = [...value].filter(x => !checkInvalidHeaderChar(x));
        }
      } else {
        if (checkInvalidHeaderChar(value)) continue;
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
        if (!trailers) stream.close();
        else stream.sendTrailers(trailers ?? {});
      });
    }
  }

  public static prepareRequestHeadersForHttp2(ctx: IMitmRequestContext): void {
    const url = ctx.url;
    const oldHeaders = ctx.requestHeaders;
    ctx.requestHeaders = Object.create(null);
    // WORKAROUND: nodejs inserts headers in reverse to front of list, so will mess with the order
    // to workaround, insert in reverse order
    // https://github.com/nodejs/node/blob/e46c680bf2b211bbd52cf959ca17ee98c7f657f5/lib/internal/http2/util.js#L521
    Object.assign(ctx.requestHeaders, {
      [HTTP2_HEADER_PATH]: url.pathname + url.search,
      [HTTP2_HEADER_SCHEME]: 'https',
      [HTTP2_HEADER_AUTHORITY]:
        oldHeaders[HTTP2_HEADER_AUTHORITY] ?? this.getRequestHeader<string>(ctx, 'host'),
      [HTTP2_HEADER_METHOD]: ctx.method,
    });

    for (const header of Object.keys(oldHeaders)) {
      const lowerKey = toLowerCase(header);
      if (stripHttp1HeadersForH2.has(lowerKey) || lowerKey.startsWith('proxy-')) {
        continue;
      }

      if (!header.startsWith(':')) {
        ctx.requestHeaders[header] = oldHeaders[header];
      }
      if (singleValueHttp2Headers.has(lowerKey)) {
        const value = ctx.requestHeaders[header];
        if (Array.isArray(value) && value.length) {
          ctx.requestHeaders[header] = value[0];
        }
      }
    }
  }

  public static cleanPushHeaders(ctx: IMitmRequestContext): void {
    for (const key of Object.keys(ctx.requestHeaders)) {
      const lowerKey = toLowerCase(key);
      if (stripHttp1HeadersForH2.has(lowerKey) || lowerKey.startsWith('proxy-')) {
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

  public static cleanProxyHeaders(ctx: IMitmRequestContext): void {
    const headers = ctx.requestHeaders;
    for (const header of Object.keys(headers)) {
      if (toLowerCase(header).startsWith('proxy-')) {
        delete headers[header];
      }
    }
  }
}


const headerCharRegex = /[^\t\x20-\x7e\x80-\xff]/;
/**
 * True if val contains an invalid field-vchar
 *  field-value    = *( field-content / obs-fold )
 *  field-content  = field-vchar [ 1*( SP / HTAB ) field-vchar ]
 *  field-vchar    = VCHAR / obs-text
 */
function checkInvalidHeaderChar(val): boolean {
  return headerCharRegex.test(val);
}

const lowerCaseMap = new Map<string, string>();

function toLowerCase(header: string): string {
  if (!lowerCaseMap.has(header)) lowerCaseMap.set(header, header.toLowerCase());
  return lowerCaseMap.get(header);
}

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
  ['worker', 'Other'],
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
