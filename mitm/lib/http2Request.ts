import http2, { ClientHttp2Session, IncomingHttpHeaders, IncomingHttpStatusHeader } from 'http2';
import https from 'https';
import { URL } from 'url';
import RequestSession from '../handlers/RequestSession';
import IHttpOrH2Response from '../interfaces/IHttpOrH2Response';

export default function http2Request(
  requestSettings: https.RequestOptions,
  session: RequestSession,
  url: URL,
  responseHandler: (response: IHttpOrH2Response) => any,
) {
  let client: ClientHttp2Session = session.http2Sessions[url.origin];
  if (!client) {
    client = http2.connect(url.origin, {
      createConnection() {
        return requestSettings.createConnection({}, null);
      },
    });
    session.http2Sessions[url.origin] = client;
  }
  const http2Stream = client.request({ ':path': url.pathname + url.search });

  http2Stream.on('response', (headers, flags) => {
    const response = convertH2Response(http2Stream, headers);
    responseHandler(response);
  });
  return http2Stream;
}

export function convertH2Response(
  http2Stream: http2.ClientHttp2Stream,
  headers: IncomingHttpHeaders & IncomingHttpStatusHeader,
) {
  const response = (http2Stream as unknown) as Partial<IHttpOrH2Response>;
  response.headers = {};
  response.rawHeaders = [];
  for (const key of Object.keys(headers)) {
    if (key[0] === ':') continue;
    response.headers[key] = headers[key];
    let value = headers[key];
    if (!Array.isArray(value)) value = [value];
    for (const val of value) {
      response.rawHeaders.push(key, val);
    }
  }
  response.method = headers[':method'];
  response.statusCode = headers[':status'];

  return response as IHttpOrH2Response;
}
