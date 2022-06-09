import IHttpHeaders from '@unblocked-web/specifications/agent/net/IHttpHeaders';
import { pickRandom } from '@ulixee/commons/lib/utils';
import IHttpResourceLoadDetails from '@unblocked-web/specifications/agent/net/IHttpResourceLoadDetails';
import IBrowserData, { IDataHeaderOrder, IDataHeaders } from '../../interfaces/IBrowserData';
import IUserAgentData from '../../interfaces/IUserAgentData';
import IEmulationProfile from '@unblocked-web/specifications/plugin/IEmulationProfile';

export default function modifyHeaders(
  emulationProfile: IEmulationProfile,
  data: IBrowserData,
  userAgentData: IUserAgentData,
  resource: IHttpResourceLoadDetails,
): boolean {
  const userAgentString = emulationProfile.userAgentOption.string;
  const locale = emulationProfile.locale;
  const defaultOrder = getResourceHeaderDefaults(emulationProfile, data.headers, resource);
  const headers = resource.requestHeaders;

  // if no default order, at least ensure connection and user-agent
  if (!defaultOrder) {
    const newHeaders: IHttpHeaders = {};
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

    resource.requestHeaders = newHeaders;

    return true;
  }

  const isXhr = resource.resourceType === 'Fetch' || resource.resourceType === 'XHR';

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
    } else if (lowerName === 'sec-ch-ua-platform') {
      // must align to user platform! (eg, "Windows")
      value = `"${userAgentData.platform}"`;
    } else if (value && lowerName === 'accept' && isXhr) {
      // allow user to customize accept value on fetch/xhr
    } else if (lowerName === 'user-agent') {
      value = userAgentString;
    } else if (defaults && !defaults.includes(value as string)) {
      value = pickRandom(defaults);
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

  const newHeaders: IHttpHeaders = {};
  for (const entry of headerList) newHeaders[entry[0]] = entry[1];

  resource.requestHeaders = newHeaders;
  return true;
}

function getResourceHeaderDefaults(
  emulationProfile: IEmulationProfile,
  headerProfiles: IDataHeaders,
  resource: IHttpResourceLoadDetails,
): Pick<IDataHeaderOrder, 'order' | 'orderKeys' | 'defaults'> {
  const { method, originType, requestHeaders: headers, resourceType } = resource;

  let protocol = resource.isServerHttp2 ? 'http2' : 'https';
  if (!resource.isSSL) protocol = 'http';

  let profiles = headerProfiles[protocol][resourceType];
  if (!profiles && resourceType === 'Websocket') {
    profiles = headerProfiles[protocol].WebsocketUpgrade;
  }
  if (!profiles) return null;

  for (const defaultOrder of profiles) {
    defaultOrder.orderKeys ??= new Set(defaultOrder.order.map(toLowerCase));
  }

  let defaultOrders = profiles.filter((x) => x.method === method);

  if (defaultOrders.length > 1) {
    const filtered = defaultOrders.filter((x) => x.originTypes.includes(originType));
    if (filtered.length) defaultOrders = filtered;
  }

  if (defaultOrders.length > 1 && (headers['sec-fetch-user'] || headers['Sec-Fetch-User'])) {
    const filtered = defaultOrders.filter((x) => x.orderKeys.has('sec-fetch-user'));
    if (filtered.length) defaultOrders = filtered;
  }

  if (defaultOrders.length > 1) {
    if (headers.Cookie || headers.cookie) {
      const filtered = defaultOrders.filter((x) => x.orderKeys.has('cookie'));
      if (filtered.length) defaultOrders = filtered;
    }
  }

  return defaultOrders.length ? pickRandom(defaultOrders) : null;
}

const lowerCaseMap = new Map<string, string>();

function toLowerCase(header: string): string {
  if (!lowerCaseMap.has(header)) lowerCaseMap.set(header, header.toLowerCase());
  return lowerCaseMap.get(header);
}
