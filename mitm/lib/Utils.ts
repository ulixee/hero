import http from 'http';
// @ts-ignore
import nodeCommon from '_http_common';
import { parse as parseUrl } from 'url';

export function parseRawHeaders(rawHeaders: string[]) {
  const headers = {};
  for (let i = 0; i < rawHeaders.length; i += 2) {
    headers[rawHeaders[i]] = rawHeaders[i + 1];
  }
  return headers;
}

export function cleanMitmHeaders(headers: { [name: string]: string }) {
  for (const header of Object.keys(headers)) {
    if (/^proxy-/i.test(header) || /^mitm-/i.test(header)) {
      delete headers[header];
    }
    if (/^access-control-request-headers/i.test(header)) {
      headers[header] = headers[header]
        .split(',')
        .filter(x => !x.match(/^mitm-/i) && !x.match(/^proxy-/i))
        .join(',');
      if (!headers[header]) delete headers[header];
    }
  }
}

export function parseHostAndPort(req: http.IncomingMessage, defaultPort?: number) {
  const match = req.url.match(/^(?:http|ws)s?:\/\/([^\/]+)(.*)/);
  if (match) {
    req.url = match[2] || '/';
    return parseHost(match[1], defaultPort);
  }
  if (req.headers.host) {
    return parseHost(req.headers.host, defaultPort);
  }
  return null;
}

export function parseHost(hostString: string, defaultPort?: number) {
  const match = hostString.match(/^(?:http|ws)s:\/\/(.*)/);
  if (match) {
    const parsedUrl = parseUrl(hostString);
    return {
      host: parsedUrl.hostname,
      port: parsedUrl.port,
    };
  }

  const hostPort = hostString.split(':');
  const host = hostPort[0];
  const port = hostPort.length === 2 ? +hostPort[1] : defaultPort;

  return {
    host: host,
    port: port,
  };
}

export function filterAndCanonizeHeaders(originalRawHeaders: string[]) {
  const headers: { [name: string]: string | string[] } = {};
  for (let i = 0; i < originalRawHeaders.length; i += 2) {
    const key = originalRawHeaders[i];
    const value = originalRawHeaders[i + 1];
    const canonizedKey = key.trim();
    if (/^public-key-pins/i.test(canonizedKey)) {
      // HPKP header => filter
      continue;
    }
    if (!nodeCommon._checkInvalidHeaderChar(value)) {
      if (headers[canonizedKey]) {
        if (!Array.isArray(headers[canonizedKey])) {
          headers[canonizedKey] = [headers[canonizedKey] as string];
        }
        (headers[canonizedKey] as string[]).push(value);
      } else {
        headers[canonizedKey] = value;
      }
    }
  }

  return headers;
}
