import * as http from 'http';
import CacheHandler from '../handlers/CacheHandler';
import RequestSession from '../handlers/RequestSession';
import http2 from 'http2';
import IHttpResourceLoadDetails from '@secret-agent/commons/interfaces/IHttpResourceLoadDetails';
import MitmSocket from '@secret-agent/mitm-socket';

export default interface IMitmRequestContext extends IHttpResourceLoadDetails {
  id: number;
  clientToProxyRequest: http.IncomingMessage | http2.Http2ServerRequest;
  cacheHandler: CacheHandler;
  didBlockResource: boolean;
  browserRequestId?: string;
  proxyToClientResponse?: http.ServerResponse | http2.Http2ServerResponse;
  proxyToServerRequest?: http.ClientRequest | http2.ClientHttp2Stream;
  serverToProxyResponseStream?: NodeJS.ReadableStream;
  requestSession?: RequestSession;
  proxyToServerSocket?: MitmSocket;
}
