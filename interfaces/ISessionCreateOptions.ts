import IUserProfile from './IUserProfile';
import ISessionOptions from './ISessionOptions';
import IScriptInstanceMeta from './IScriptInstanceMeta';
import IViewport from './IViewport';
import IGeolocation from './IGeolocation';

export default interface ISessionCreateOptions extends ISessionOptions {
  sessionName?: string;
  sessionKeepAlive?: boolean;
  sessionResume?: {
    startLocation: 'currentLocation' | 'pageStart' | 'sessionStart';
    sessionId: string;
  };

  browserEmulatorId?: string;
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

  showBrowser?: boolean;
  showBrowserInteractions?: boolean;
  allowManualBrowserInteraction?: boolean;
}
