import * as http from 'http';
import http2 from 'http2';
import IHttpResourceLoadDetails from '@secret-agent/commons/interfaces/IHttpResourceLoadDetails';
import MitmSocket from '@secret-agent/mitm-socket';
import RequestSession from '../handlers/RequestSession';
import CacheHandler from '../handlers/CacheHandler';

export default interface IMitmRequestContext extends IHttpResourceLoadDetails {
  id: number;
  clientToProxyRequest: http.IncomingMessage | http2.Http2ServerRequest;
  cacheHandler: CacheHandler;
  didBlockResource: boolean;
  browserRequestId?: string;
  proxyToClientResponse?: http.ServerResponse | http2.Http2ServerResponse;
  proxyToServerRequest?: http.ClientRequest | http2.ClientHttp2Stream;
  serverToProxyResponse?: http.IncomingMessage | http2.ClientHttp2Stream;
  requestSession?: RequestSession;
  proxyToServerMitmSocket?: MitmSocket;
}
