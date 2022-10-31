import { URL } from 'url';
import * as http from 'http';
import * as cookie from 'cookie';
import * as http2 from 'http2';
import ResourceType from '../interfaces/ResourceType';
import IRequestDetails from '../interfaces/IRequestDetails';
import OriginType from '../interfaces/OriginType';
import { cleanDomains, DomainType, getDomainType } from './DomainUtils';
import BaseServer from '../servers/BaseServer';
import Session from './Session';

export default async function extractRequestDetails(
  server: BaseServer,
  req: http.IncomingMessage | http2.Http2ServerRequest,
  session: Session,
  overrideResourceType?: ResourceType,
): Promise<{ requestDetails: IRequestDetails; requestUrl: URL }> {
  const time = new Date();
  const userAgentString = req.headers['user-agent'];
  const addr = `${req.socket.remoteAddress.split(':').pop()}:${req.socket.remotePort}`;
  const requestUrl = server.getRequestUrl(req);

  let body = '';
  let bodyJson: any = {};

  for await (const chunk of req) {
    body += chunk.toString();
  }

  if (req.headers['content-type'] === 'application/json') {
    bodyJson = JSON.parse(body);
  }

  const cookies = cookie.parse(req.headers.cookie ?? '');
  const rawHeaders = parseHeaders(req.rawHeaders);

  const requestDetails: IRequestDetails = {
    userAgentString,
    bodyJson,
    cookies,
    time,
    remoteAddress: addr,
    url: cleanUrl(requestUrl.href, session.id),
    origin: cleanUrl(req.headers.origin as string, session.id),
    originType: OriginType.None,
    referer: cleanUrl(req.headers.referer, session.id),
    method: req.method,
    headers: rawHeaders.map((x) => cleanUrl(x, session.id)),
    domainType: getDomainType(requestUrl),
    secureDomain: ['https', 'tls', 'http2'].includes(server.protocol),
    resourceType: overrideResourceType ?? getResourceType(req.method, requestUrl.pathname),
  };

  // if origin sent, translate into origin type
  if (requestDetails.origin && requestDetails.origin !== 'null') {
    requestDetails.originType = getOriginType(
      new URL(requestDetails.origin),
      requestDetails.domainType,
    );
  } else if (requestDetails.referer) {
    requestDetails.originType = getOriginType(
      new URL(requestDetails.referer),
      requestDetails.domainType,
    );
  }

  return {
    requestDetails,
    requestUrl,
  };
}

export function getResourceType(httpMethod: string, pathname: string): ResourceType {
  if (httpMethod === 'OPTIONS') {
    return ResourceType.Preflight;
  }
  if (pathname.endsWith('.map')) {
    return ResourceType.Other;
  }
  if (pathname.endsWith('worker.js')) {
    return ResourceType.Other;
  }
  if (pathname.endsWith('.js')) {
    return ResourceType.Script;
  }
  if (pathname.endsWith('.css')) {
    return ResourceType.Stylesheet;
  }
  if (pathname.endsWith('.png') || pathname.endsWith('.svg')) {
    return ResourceType.Image;
  }
  if (pathname.endsWith('.ico')) {
    return ResourceType.Ico;
  }
  if (pathname.endsWith('.mp3') || pathname.endsWith('.webm')) {
    return ResourceType.Media;
  }
  if (
    pathname.endsWith('.ttf') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.otf')
  ) {
    return ResourceType.Font;
  }
  if (pathname.includes('fetch')) {
    return ResourceType.Fetch;
  }
  if (pathname.includes('axios') || pathname.endsWith('.json')) {
    return ResourceType.XHR;
  }
  return ResourceType.Document;
}

export function getOriginType(referer: URL, hostDomainType: DomainType): OriginType {
  if (!referer) return OriginType.None;
  const refererDomainType = getDomainType(referer);

  if (hostDomainType === refererDomainType) {
    return OriginType.SameOrigin;
  }

  if (hostDomainType === DomainType.SubDomain && refererDomainType === DomainType.MainDomain) {
    return OriginType.SameSite;
  }

  if (hostDomainType === DomainType.MainDomain && refererDomainType === DomainType.SubDomain) {
    return OriginType.SameSite;
  }

  return OriginType.CrossSite;
}

function parseHeaders(rawHeaders: string[]): string[] {
  const headers = rawHeaders;
  const headerPrintout: string[] = [];
  for (let i = 0; i < headers.length; i += 2) {
    const key = headers[i];
    const value = headers[i + 1];
    headerPrintout.push(`${key}=${value}`);
  }
  return headerPrintout;
}

function cleanUrl(url: string, sessionId: string): string {
  if (!url) return url;

  return cleanDomains(url)
    .replace(RegExp(`sessionId=${sessionId}`, 'g'), 'sessionId=X')
    .replace(/:[0-9]+\//, '/');
}
