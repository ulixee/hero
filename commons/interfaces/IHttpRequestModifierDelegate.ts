import OriginType from './OriginType';
import IHttpResourceLoadDetails from './IHttpResourceLoadDetails';
import ResourceType from '@secret-agent/core-interfaces/ResourceType';
import IResourceHeaders from '@secret-agent/core-interfaces/IResourceHeaders';

export default interface IHttpRequestModifierDelegate {
  modifyHeadersBeforeSend?: (request: IResourceToModify) => { [key: string]: string };

  maxConnectionsPerOrigin?: number;

  getCookieHeader?: (resource: IHttpResourceLoadDetails) => Promise<string>;
  setCookie?: (
    cookie: string,
    resource: IHttpResourceLoadDetails,
    statusCode: number,
  ) => Promise<void>;
  documentHasUserActivity?: (documentUrl: string) => void;

  tlsProfileId?: string;

  tcpVars?: { windowSize: number; ttl: number };
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
