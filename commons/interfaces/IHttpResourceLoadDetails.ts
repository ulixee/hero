import ResourceType from '@secret-agent/core-interfaces/ResourceType';
import { URL } from 'url';
import IResourceHeaders from '@secret-agent/core-interfaces/IResourceHeaders';
import OriginType from './OriginType';

export default interface IHttpResourceLoadDetails {
  isSSL: boolean;
  isUpgrade: boolean;
  isClientHttp2: boolean;
  isServerHttp2: boolean;
  isHttp2Push: boolean;
  remoteAddress?: string;
  localAddress?: string;
  originType?: OriginType;
  hasUserGesture?: boolean;
  documentUrl?: string;
  isUserNavigation?: boolean;
  isFromRedirect?: boolean;
  previousUrl?: string;
  firstRedirectingUrl?: string; // track back to first redirection
  redirectedToUrl?: string;
  clientAlpn: string;
  dnsResolvedIp?: string;
  url: URL;
  method: string;
  requestTime: Date;
  requestOriginalHeaders: IResourceHeaders;
  requestLowerHeaders: IResourceHeaders;
  requestHeaders: IResourceHeaders;
  requestTrailers?: IResourceHeaders;
  requestPostData?: Buffer;
  status?: number;
  statusMessage?: string;
  responseUrl?: string;
  responseOriginalHeaders?: IResourceHeaders;
  responseHeaders?: IResourceHeaders;
  responseTime?: Date;
  responseTrailers?: IResourceHeaders;
  resourceType?: ResourceType;
}
