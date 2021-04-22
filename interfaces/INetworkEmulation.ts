import { ConnectionOptions } from 'tls';
import { URL } from 'url';
import IHttpResourceLoadDetails from './IHttpResourceLoadDetails';

export default interface INetworkEmulation {
  dns?: {
    dnsOverTlsConnection: ConnectionOptions;
    useUpstreamProxy?: boolean;
  };
  socketSettings?: {
    tcpWindowSize?: number;
    tcpTtl?: number;
    tlsClientHelloId?: string;
    socketsPerOrigin?: number;
  };
  beforeHttpRequest?(request: IHttpResourceLoadDetails): Promise<any>;
  beforeHttpResponse?(resource: IHttpResourceLoadDetails): Promise<any>;
  // Function needed for browsers implementing first-party cookies
  websiteHasFirstPartyInteraction?(url: URL): void;
}
