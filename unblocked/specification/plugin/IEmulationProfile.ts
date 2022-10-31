import type { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import IUserAgentOption from './IUserAgentOption';
import IDeviceProfile from './IDeviceProfile';
import IGeolocation from './IGeolocation';
import IBrowserEngine from '../agent/browser/IBrowserEngine';
import IViewport from '../agent/browser/IViewport';
import IBrowserLaunchArgs from '../agent/browser/IBrowserLaunchArgs';

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
  upstreamProxyIpMask?: { publicIp?: string; proxyIp?: string; ipLookupService?: string };
  geolocation?: IGeolocation;
  dnsOverTlsProvider?: { host: string; servername: string; port?: number };
}

export type IEmulationOptions = IBrowserLaunchArgs & Pick<
  IEmulationProfile,
  | 'viewport'
  | 'timezoneId'
  | 'locale'
  | 'upstreamProxyIpMask'
  | 'upstreamProxyUrl'
  | 'geolocation'
  | 'dnsOverTlsProvider'
>;
