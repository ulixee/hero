import IUserProfile from './IUserProfile';
import ISessionOptions from './ISessionOptions';
import IScriptInstanceMeta from './IScriptInstanceMeta';
import IViewport from './IViewport';
import IGeolocation from './IGeolocation';

export default interface ISessionCreateOptions extends ISessionOptions {
  sessionId?: string;
  sessionName?: string;
  sessionKeepAlive?: boolean;
  sessionResume?: {
    sessionId: string;
    startLocation: 'currentLocation' | 'sessionStart';
  };
  browserEmulatorId?: string;
  mode?: 'development' | 'multiverse' | 'production' | 'timetravel' | 'browserless';
  userAgent?: string;
  scriptInstanceMeta?: IScriptInstanceMeta;
  userProfile?: IUserProfile;
  viewport?: IViewport;
  timezoneId?: string;
  locale?: string;
  upstreamProxyUrl?: string;
  upstreamProxyIpMask?: { publicIp?: string; proxyIp?: string; ipLookupService?: string };
  input?: { command?: string } & any;
  geolocation?: IGeolocation;
  dependencyMap?: { [clientPluginId: string]: string[] };
  corePluginPaths?: string[];
  dnsOverTlsProvider?: { host: string; servername: string; port?: number };
  showChrome?: boolean;
  showChromeAlive?: boolean;
  showChromeInteractions?: boolean;
}
