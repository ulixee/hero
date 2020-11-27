import IUserProfile from './IUserProfile';
import ISessionOptions from './ISessionOptions';
import IScriptInstanceMeta from './IScriptInstanceMeta';
import IViewport from './IViewport';
import IUpstreamProxy from './IUpstreamProxy';

export default interface ICreateSessionOptions extends ISessionOptions {
  sessionName?: string;
  browserEmulatorId?: string;
  userProfile?: IUserProfile;
  scriptInstanceMeta?: IScriptInstanceMeta;
  viewport?: IViewport;
  timezoneId?: string;
  locale?: string;
  upstreamProxy?: IUpstreamProxy;
}
