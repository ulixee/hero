import IUserProfile from './IUserProfile';
import ISessionOptions from './ISessionOptions';
import IScriptInstanceMeta from './IScriptInstanceMeta';
import IViewport from './IViewport';

export default interface ISessionCreateOptions extends ISessionOptions {
  sessionName?: string;
  browserEmulatorId?: string;
  userAgent?: string;
  scriptInstanceMeta?: IScriptInstanceMeta;
  userProfile?: IUserProfile;
  viewport?: IViewport;
  timezoneId?: string;
  locale?: string;
  upstreamProxyUrl?: string;
  input?: { command?: string } & any;
  dependencyMap?: { [clientPluginId: string]: string[] }
}
