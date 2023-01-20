import { URL } from 'url';
import IDnsSettings from '../net/IDnsSettings';
import ITcpSettings from '../net/ITcpSettings';
import IHttpSocketAgent from '../net/IHttpSocketAgent';
import IHttpResourceLoadDetails from '../net/IHttpResourceLoadDetails';
import IHttp2ConnectSettings from '../net/IHttp2ConnectSettings';
import ITlsSettings from '../net/ITlsSettings';
import IResourceType from '../net/IResourceType';

export default interface INetworkHooks {
  onDnsConfiguration?(settings: IDnsSettings): void;

  onTcpConfiguration?(settings: ITcpSettings): void;

  onTlsConfiguration?(settings: ITlsSettings): void;

  onHttpAgentInitialized?(agent: IHttpSocketAgent): Promise<any> | void;

  onHttp2SessionConnect?(
    request: IHttpResourceLoadDetails,
    settings: IHttp2ConnectSettings,
  ): Promise<any> | void;

  shouldBlockRequest?(url: string, resourceTypeIfKnown?: IResourceType): boolean;
  beforeHttpRequest?(request: IHttpResourceLoadDetails): Promise<any> | void;
  beforeHttpResponse?(resource: IHttpResourceLoadDetails): Promise<any> | void;
  websiteHasFirstPartyInteraction?(url: URL): Promise<any> | void; // needed for implementing first-party cookies
}
