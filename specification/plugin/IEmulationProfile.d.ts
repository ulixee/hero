import type { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import IUserAgentOption from './IUserAgentOption';
import IDeviceProfile from './IDeviceProfile';
import IGeolocation from './IGeolocation';
import IBrowserEngine from '../agent/browser/IBrowserEngine';
import IViewport from '../agent/browser/IViewport';
import IBrowserUserConfig from '../agent/browser/IBrowserUserConfig';
export default interface IEmulationProfile<T = any> {
    logger?: IBoundLog;
    userAgentOption?: IUserAgentOption;
    windowNavigatorPlatform?: string;
    deviceProfile?: IDeviceProfile;
    browserEngine?: IBrowserEngine;
    options?: IEmulationOptions;
    customEmulatorConfig?: T;
    viewport?: IViewport;
    timezoneId?: string;
    locale?: string;
    upstreamProxyUrl?: string;
    upstreamProxyUseLocalDns?: boolean;
    upstreamProxyIpMask?: {
        publicIp?: string;
        proxyIp?: string;
        ipLookupService?: string;
    };
    geolocation?: IGeolocation;
    dnsOverTlsProvider?: {
        host: string;
        servername: string;
        port?: number;
    };
}
export type IEmulationOptions = IBrowserUserConfig & Pick<IEmulationProfile, 'viewport' | 'timezoneId' | 'locale' | 'upstreamProxyIpMask' | 'upstreamProxyUseLocalDns' | 'upstreamProxyUrl' | 'geolocation' | 'dnsOverTlsProvider'>;
