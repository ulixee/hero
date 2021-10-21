import IUserProfile from './IUserProfile';
import ISessionOptions from './ISessionOptions';
import IScriptInstanceMeta from './IScriptInstanceMeta';
import IViewport from './IViewport';
import IGeolocation from './IGeolocation';

export default interface ISessionCreateOptions extends ISessionOptions {
  sessionId?: string;
  externalIds?: { [id: string]: number | string | string[] | number[] };
  sessionName?: string;
  sessionKeepAlive?: boolean;
  sessionResume?: {
    sessionId: string;
    startLocation: 'currentLocation' | 'sessionStart';
    startNavigationId?: number;
  };
  browserEmulatorId?: string;
  mode?: 'development' | 'multiverse' | 'production';
  userAgent?: string;
  scriptInstanceMeta?: IScriptInstanceMeta;
  userProfile?: IUserProfile;
  viewport?: IViewport;
  timezoneId?: string;
  locale?: string;
  upstreamProxyUrl?: string;
  input?: { command?: string } & any;
  geolocation?: IGeolocation;
  dependencyMap?: { [clientPluginId: string]: string[] };
  corePluginPaths?: string[];
  dnsOverTlsProvider?: { host: string; port: number };
  showBrowser?: boolean;
  showBrowserInteractions?: boolean;
  allowManualBrowserInteraction?: boolean;
}
