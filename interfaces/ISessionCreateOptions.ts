import IUserProfile from './IUserProfile';
import ISessionOptions from './ISessionOptions';
import IScriptInstanceMeta from './IScriptInstanceMeta';
import { IBrowserEmulatorConfig } from '@unblocked-web/emulator-spec/IBrowserEmulator';
import IBrowserLaunchArgs from '@unblocked-web/emulator-spec/browser/IBrowserLaunchArgs';

export default interface ISessionCreateOptions extends ISessionOptions, IBrowserEmulatorConfig, IBrowserLaunchArgs {
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
  input?: { command?: string } & any;

  dependencyMap?: { [clientPluginId: string]: string[] };
  corePluginPaths?: string[];
  showChrome?: boolean;
  showChromeAlive?: boolean;
  showChromeInteractions?: boolean;
}
