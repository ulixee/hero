import * as http from 'http';
import IMitmProxyToServerRequestSettings from './IMitmProxyToServerRequestOptions';
import CacheHandler from '../handlers/CacheHandler';
import RequestSession from '../handlers/RequestSession';
import http2 from 'http2';
import IHttpResourceLoadDetails from '@secret-agent/commons/interfaces/IHttpResourceLoadDetails';
import IHttpOrH2Response from './IHttpOrH2Response';
import MitmSocket from '@secret-agent/mitm-socket';

export default interface IMitmRequestContext extends IHttpResourceLoadDetails {
  id: number;
  origin: string;
  clientToProxyRequest: http.IncomingMessage;
  proxyToServerRequestSettings: IMitmProxyToServerRequestSettings;
  responseContentPotentiallyModified: boolean;
  cacheHandler: CacheHandler;
  didBlockResource: boolean;
  browserRequestId?: string;
  proxyToClientResponse?: http.ServerResponse;
  proxyToServerRequest?: http.ClientRequest | http2.ClientHttp2Stream;
  serverToProxyResponse?: IHttpOrH2Response;
  requestSession?: RequestSession;
  proxyToServerSocket?: MitmSocket;
}
