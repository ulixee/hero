import IUserProfile from './IUserProfile';
import ISessionOptions from './ISessionOptions';
import IScriptInstanceMeta from './IScriptInstanceMeta';
import { IEmulationOptions } from '@unblocked-web/specifications/plugin/IEmulationProfile';

export default interface ISessionCreateOptions extends ISessionOptions, IEmulationOptions {
  sessionId?: string;
  sessionName?: string;
  sessionKeepAlive?: boolean;
  sessionResume?: {
    sessionId: string;
    startLocation: 'currentLocation' | 'sessionStart';
  };
  mode?: 'development' | 'multiverse' | 'production' | 'timetravel' | 'browserless';
  userAgent?: string;
  scriptInstanceMeta?: IScriptInstanceMeta;
  userProfile?: IUserProfile;
  input?: { command?: string } & any;

  dependencyMap?: { [clientPluginId: string]: string[] };
  corePluginPaths?: string[];
  showChrome?: boolean;
  showChromeAlive?: boolean;
  showChromeInteractions?: boolean;
}
