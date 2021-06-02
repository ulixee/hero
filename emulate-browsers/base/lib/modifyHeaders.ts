import Log from '@secret-agent/commons/Logger';
import IResourceHeaders from '@secret-agent/interfaces/IResourceHeaders';
import { pickRandom } from '@secret-agent/commons/utils';
import IHttpResourceLoadDetails from '@secret-agent/interfaces/IHttpResourceLoadDetails';

const { log } = Log(module);

export default function modifyHeaders(
  userAgentString: string,
  headerProfiles: IResourceHeaderDefaults,
  locale: string,
  resource: IHttpResourceLoadDetails,
  sessionId: string,
) {
  const defaultOrder = getResourceHeaderDefaults(headerProfiles, resource, sessionId);

  const headers = resource.requestHeaders;

  // if no default order, at least ensure connection and user-agent
  if (!defaultOrder) {
    const newHeaders: IResourceHeaders = {};
    let hasKeepAlive = false;
    for (const [header, value] of Object.entries(headers)) {
      const lower = toLowerCase(header);
      if (lower === 'connection') hasKeepAlive = true;

      if (lower === 'user-agent') {
        newHeaders[header] = userAgentString;
      } else {
        newHeaders[header] = value;
      }
    }
    if (!hasKeepAlive && !resource.isServerHttp2) {
      newHeaders.Connection = 'keep-alive';
    }
    return newHeaders;
  }

  const isXhr = resource.resourceType === 'Fetch' || resource.resourceType === 'Xhr';

  const requestLowerHeaders = {};
  for (const [key, value] of Object.entries(resource.requestHeaders)) {
    requestLowerHeaders[toLowerCase(key)] = value;
  }

  // First add headers in the default order
  const headerList: [string, string | string[]][] = [];
  for (const headerName of defaultOrder.order) {
    const defaults = defaultOrder.defaults[headerName];
    const lowerName = toLowerCase(headerName);
    let value = requestLowerHeaders[lowerName];

    if (lowerName === 'accept-language') {
      value = `${locale};q=0.9`;
      // if header is an Sec- header, trust Chrome
    } else if (value && lowerName.startsWith('sec-')) {
      // keep given value
    } else if (value && lowerName === 'accept' && isXhr) {
      // allow user to customize accept value on fetch/xhr
    } else if (defaults && !defaults.includes(value as string)) {
      value = pickRandom(defaults);
    }

    if (lowerName === 'user-agent') {
      value = userAgentString;
    }
    if (value) {
      headerList.push([headerName, value]);
    }
  }

  // Now go through and add any custom headers
  let index = -1;
  for (const [header, value] of Object.entries(headers)) {
    index += 1;
    const lowerHeader = toLowerCase(header);
    const isAlreadyIncluded = defaultOrder.orderKeys.has(lowerHeader);
    if (isAlreadyIncluded) continue;

    // if past the end, reset the index to the last spot
    if (index >= headerList.length) index = headerList.length - 1;

    // insert at same index it would have been otherwise (unless past end)
    headerList.splice(index, 0, [header, value]);
  }

  const newHeaders: IResourceHeaders = {};
  for (const entry of headerList) newHeaders[entry[0]] = entry[1];

  return newHeaders;
}

function getResourceHeaderDefaults(
  headerProfiles: IResourceHeaderDefaults,
  resource: IHttpResourceLoadDetails,
  sessionId: string,
): Pick<IHeaderOrder, 'order' | 'orderKeys' | 'defaults'> {
  const { method, originType, requestHeaders: headers, resourceType, isSSL } = resource;

  let protocol = resource.isServerHttp2 ? 'http2' : 'https';
  if (!resource.isSSL) protocol = 'http';

  let profiles = headerProfiles[protocol][resourceType];
  if (!profiles && resourceType === 'Websocket')
    profiles = headerProfiles[protocol].WebsocketUpgrade;
  if (!profiles) return null;

  for (const defaultOrder of profiles) {
    defaultOrder.orderKeys ??= new Set(defaultOrder.order.map(toLowerCase));
  }

  let defaultOrders = profiles.filter(x => x.method === method);

  if (defaultOrders.length > 1) {
    const filtered = defaultOrders.filter(x => x.originTypes.includes(originType));
    if (filtered.length) defaultOrders = filtered;
  }

  if (defaultOrders.length > 1 && (headers['sec-fetch-user'] || headers['Sec-Fetch-User'])) {
    const filtered = defaultOrders.filter(x => x.orderKeys.has('sec-fetch-user'));
    if (filtered.length) defaultOrders = filtered;
  }

  if (defaultOrders.length > 1) {
    if (headers.Cookie || headers.cookie) {
      const filtered = defaultOrders.filter(x => x.orderKeys.has('cookie'));
      if (filtered.length) defaultOrders = filtered;
    }
  }

  const defaultOrder = defaultOrders.length ? pickRandom(defaultOrders) : null;

  if (!defaultOrder) {
    log.warn('Headers.NotFound', { sessionId, resourceType, isSSL, method, originType });
    return null;
  }

  return defaultOrder;
}

interface IResourceHeaderDefaults {
  [protocol: string]: {
    [resourceType: string]: IHeaderOrder[];
  };
}

interface IHeaderOrder {
  originTypes: string[];
  method: string;
  order: string[];
  defaults: { [header: string]: string[] };
  orderKeys?: Set<string>; // constructed as accessed
}

const lowerCaseMap = new Map<string, string>();

function toLowerCase(header: string): string {
  if (!lowerCaseMap.has(header)) lowerCaseMap.set(header, header.toLowerCase());
  return lowerCaseMap.get(header);
}
