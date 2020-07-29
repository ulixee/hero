import http2, { IncomingHttpHeaders, IncomingHttpStatusHeader } from 'http2';
import https from 'https';
import { URL } from 'url';
import RequestSession, { IHttp2Session } from '../handlers/RequestSession';
import IHttpOrH2Response from '../interfaces/IHttpOrH2Response';
import Log from '../../commons/Logger';
import SocketConnectDriver from './SocketConnectDriver';

const { log } = Log(module);

export default function http2Request(
  requestSettings: https.RequestOptions,
  http2Session: IHttp2Session,
  socketConnect: SocketConnectDriver,
  session: RequestSession,
  url: URL,
  responseHandler: (response: IHttpOrH2Response) => any,
) {
  let client = http2Session?.client;
  if (!client) {
    client = http2.connect(url.origin, {
      createConnection: () => socketConnect.socket,
    });
    client.on('remoteSettings', settings => {
      log.info('Http2Client.remoteSettings', {
        sessionId: session.sessionId,
        settings,
      });
    });
    client.on('frameError', (frameType: number, errorCode: number) => {
      log.warn('Http2Client.frameError', {
        sessionId: session.sessionId,
        frameType,
        errorCode,
      });
    });
    session.trackH2Session(url.origin, client, socketConnect);
  }

  const h2Headers = requestSettings.headers as http2.OutgoingHttpHeaders;
  h2Headers[':authority'] = requestSettings.headers.host ?? requestSettings.headers.Host;
  h2Headers[':path'] = url.pathname + url.search;
  h2Headers[':method'] = requestSettings.method;
  h2Headers[':scheme'] = 'https';
  for (const key of Object.keys(h2Headers)) {
    if (key.match(/connection/i) || key.match(/host/i)) {
      delete h2Headers[key];
    }
  }

  const http2Stream = client.request(h2Headers);

  http2Stream.on('response', (headers, flags) => {
    const response = convertH2Response(http2Stream, headers);
    responseHandler(response);
  });
  http2Stream.on('push', (headers: IncomingHttpHeaders, flags: number) => {
    log.warn('Http2PushReceived, but cannot push to client', {
      sessionId: session?.sessionId,
      headers,
      flags,
    });
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
