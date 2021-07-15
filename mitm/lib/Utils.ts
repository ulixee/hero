import IResourceHeaders from '@ulixee/hero-interfaces/IResourceHeaders';

export function parseRawHeaders(rawHeaders: string[]): IResourceHeaders {
  const headers = {};
  for (let i = 0; i < rawHeaders.length; i += 2) {
    const key = rawHeaders[i];
    const value = rawHeaders[i + 1];
    if (headers[key] || key.toLowerCase() === 'set-cookie') {
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
