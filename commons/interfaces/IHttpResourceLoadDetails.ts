import OriginType from './OriginType';
import ResourceType from '@secret-agent/core-interfaces/ResourceType';

export default interface IHttpResourceLoadDetails {
  isSSL: boolean;
  isUpgrade: boolean;
  isHttp2: boolean;
  remoteAddress?: string;
  localAddress?: string;
  requestTime: Date;
  url: string;
  postData?: Buffer;
  resourceType?: ResourceType;
  originType?: OriginType;
  hasUserGesture?: boolean;
  documentUrl?: string;
  isUserNavigation?: boolean;
  isFromRedirect?: boolean;
  previousUrl?: string;
  firstRedirectingUrl?: string; // track back to first redirection
  redirectedToUrl?: string;
}
