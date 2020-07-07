import OriginType from './OriginType';
import IHttpResourceLoadDetails from './IHttpResourceLoadDetails';
import ResourceType from '@secret-agent/core-interfaces/ResourceType';

export default interface IHttpRequestModifierDelegate {
  modifyHeadersBeforeSend?: (
    resourceType: ResourceType,
    secureDomain: boolean,
    method: string,
    originType: OriginType,
    headers: { [name: string]: string },
  ) => { [key: string]: string };

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
