import { ConnectionOptions } from 'tls';
import ResourceType from './ResourceType';
import IResourceHeaders from './IResourceHeaders';
import OriginType from './OriginType';
import IHttpResourceLoadDetails from './IHttpResourceLoadDetails';

export default interface INetworkInterceptorDelegate {
  tcp?: { windowSize: number; ttl: number };
  tls?: {
    emulatorProfileId: string;
  };
  dns?: {
    dnsOverTlsConnection: ConnectionOptions;
    useUpstreamProxy?: boolean;
  };
  connections?: {
    socketsPerOrigin: number;
  };
  http: {
    requestHeaders?: (request: IResourceToModify) => { [key: string]: string };
    cookieHeader?: (resource: IHttpResourceLoadDetails) => Promise<string>;
    onSetCookie?: (
      cookie: string,
      resource: IHttpResourceLoadDetails,
      statusCode: number,
    ) => Promise<void>;
    onOriginHasFirstPartyInteraction?: (documentUrl: string) => void;
  };
}

export interface IResourceToModify {
  isServerHttp2: boolean;
  isClientHttp2: boolean;
  sessionId: string;
  resourceType: ResourceType;
  isSSL: boolean;
  method: string;
  originType: OriginType;
  lowerHeaders: IResourceHeaders;
  headers: IResourceHeaders;
}
