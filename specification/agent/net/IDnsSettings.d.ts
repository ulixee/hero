import { ConnectionOptions } from 'tls';
export default interface IDnsSettings {
    dnsOverTlsConnection?: ConnectionOptions;
    useUpstreamProxy?: boolean;
}
