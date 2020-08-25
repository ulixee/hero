import IUserAgent from '@secret-agent/emulators/interfaces/IUserAgent';
import OriginType from '@secret-agent/commons/interfaces/OriginType';
import { pickRandom } from '@secret-agent/emulators/lib/Utils';
import Log from '@secret-agent/commons/Logger';
import { IResourceToModify } from '@secret-agent/commons/interfaces/IHttpRequestModifierDelegate';
import IResourceHeaders from '@secret-agent/core-interfaces/IResourceHeaders';

const { log } = Log(module);

export default function modifyHeaders(
  userAgent: IUserAgent,
  headerProfiles: IResourceHeaderDefaults,
  resource: IResourceToModify,
) {
  const defaultOrder = getOrderAndDefaults(headerProfiles, resource);

  const { headers, lowerHeaders } = resource;
  if (!defaultOrder || (resource.isClientHttp2 && resource.isServerHttp2)) {
    for (const [header, value] of Object.entries(headers)) {
      if (header.match(/user-agent/i) && value !== userAgent.raw) {
        headers[header] = value;
      }
    }
    return headers;
  }

  const headerlist: [string, string | string[]][] = [];
  for (const headerName of defaultOrder.order) {
    const defaults = defaultOrder.defaults[headerName];
    let value = lowerHeaders[headerName.toLowerCase()];

    // if header is an Sec-Fetch header, trust Chrome
    if (value && headerName.toLowerCase().startsWith('sec-fetch')) {
      // keep given value
    } else if (defaults && defaults.length) {
      // trust that it's doing it's thing
      if (!defaults.includes(value as string)) {
        value = pickRandom(defaults);
      }
    }

    if (headerName.match(/user-agent/i) && value !== userAgent.raw) {
      value = userAgent.raw;
    }
    if (value) {
      headerlist.push([headerName, value]);
    }
  }

  const lowerNames = defaultOrder.order.map(x => x.toLowerCase());
  let index = -1;
  for (const [header, value] of Object.entries(headers)) {
    index += 1;
    const lowerHeader = header.toLowerCase();
    const isAlreadyIncluded = lowerNames.includes(lowerHeader);
    if (isAlreadyIncluded) continue;

    const isDefaultHeader =
      defaultHeaders.includes(lowerHeader) ||
      lowerHeader.startsWith('sec-') ||
      lowerHeader.startsWith('mitm-') ||
      lowerHeader.startsWith('proxy-');

    const shouldIncludeOrigin =
      lowerHeader === 'origin' && lowerHeaders['sec-fetch-mode'] === 'cors';

    // if default order does not include this header, strip it
    if (isDefaultHeader && lowerHeader !== 'cookie' && !shouldIncludeOrigin) continue;

    // if past the end, reset the index to the last spot
    if (index >= headerlist.length) index = headerlist.length - 1;

    // insert at same index it would have been otherwise (unless past end)
    headerlist.splice(index, 0, [header, value]);
  }

  const newHeaders: IResourceHeaders = {};
  for (const entry of headerlist) newHeaders[entry[0]] = entry[1];

  return newHeaders;
}

function getOrderAndDefaults(headerProfiles: IResourceHeaderDefaults, resource: IResourceToModify) {
  const { method, originType, headers, resourceType, isSSL, sessionId } = resource;
  let profiles = headerProfiles[resourceType];
  if (!profiles && resourceType === 'Websocket') profiles = headerProfiles['Websocket Upgrade'];
  if (!profiles) return null;

  let defaultOrders = profiles.filter(x => x.secureDomain === isSSL);

  if (defaultOrders.length > 1) {
    const methodOrders = defaultOrders.filter(x => x.method.toLowerCase() === method.toLowerCase());
    if (methodOrders.length) {
      defaultOrders = methodOrders;
    }
  }

  if (defaultOrders.length > 1) {
    const originDefaultOrders = defaultOrders.filter(x => x.originTypes.includes(originType));
    if (originDefaultOrders.length) {
      defaultOrders = originDefaultOrders;
    }
  }

  let defaultOrder = pickRandom(defaultOrders);
  if (headers.Cookie || headers.cookie) {
    const withCookie = defaultOrders.find(x => x.order.includes('Cookie'));
    if (withCookie) defaultOrder = withCookie;
  }

  if (!defaultOrder) {
    log.error('Headers.NotFound', { sessionId, resourceType, isSSL, method, originType });
    return null;
  }

  return {
    order: defaultOrder.order,
    defaults: defaultOrder.defaults,
  };
}

interface IResourceHeaderDefaults {
  [resourceType: string]: {
    originTypes: OriginType[];
    method: string;
    secureDomain: boolean;
    order: string[];
    defaults: { [header: string]: string[] };
  }[];
}

const defaultHeaders = [
  'accept',
  'accept-charset',
  'accept-encoding',
  'accept-language',
  'accept-patch',
  'accept-ranges',
  'access-control-allow-credentials',
  'access-control-allow-headers',
  'access-control-allow-methods',
  'access-control-allow-origin',
  'access-control-expose-headers',
  'access-control-max-age',
  'access-control-request-headers',
  'access-control-request-method',
  'age',
  'allow',
  'alt-svc',
  'authorization',
  'cache-control',
  'connection',
  'content-disposition',
  'content-encoding',
  'content-language',
  'content-length',
  'content-location',
  'content-range',
  'content-type',
  'cookie',
  'date',
  'expect',
  'expires',
  'forwarded',
  'from',
  'host',
  'if-match',
  'if-modified-since',
  'if-none-match',
  'if-range',
  'if-unmodified-since',
  'last-modified',
  'location',
  'origin',
  'pragma',
  'proxy-authenticate',
  'proxy-authorization',
  'proxy-connection',
  'public-key-pins',
  'range',
  'referer',
  'retry-after',
  'sec-fetch-mode',
  'sec-fetch-site',
  'sec-fetch-user',
  'sec-origin-policy',
  'set-cookie',
  'strict-transport-security',
  'tk',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'upgrade-insecure-requests',
  'user-agent',
  'vary',
  'via',
  'warning',
  'www-authenticate',
];
