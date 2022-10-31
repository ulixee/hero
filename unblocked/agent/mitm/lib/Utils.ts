import IHttpHeaders from '@unblocked-web/specifications/agent/net/IHttpHeaders';

export function parseRawHeaders(rawHeaders: string[]): IHttpHeaders {
  const headers = {};
  for (let i = 0; i < rawHeaders.length; i += 2) {
    const key = rawHeaders[i];
    const value = rawHeaders[i + 1];
    if (headers[key] || toLowerCase(key) === 'set-cookie') {
      if (Array.isArray(headers[key])) {
        headers[key].push(value);
      } else if (headers[key]) {
        headers[key] = [headers[key], value];
      } else {
        headers[key] = [value];
      }
    } else {
      headers[key] = value;
    }
  }
  return headers;
}

const lowerCaseMap: { [key: string]: string } = {};

export function toLowerCase(header: string): string {
  lowerCaseMap[header] ??= header.toLowerCase();
  return lowerCaseMap[header];
}
