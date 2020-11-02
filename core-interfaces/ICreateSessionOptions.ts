import IUserProfile from './IUserProfile';
import ISessionOptions from './ISessionOptions';
import IScriptInstanceMeta from './IScriptInstanceMeta';
import IViewport from './IViewport';

export default interface ICreateSessionOptions extends ISessionOptions {
  sessionName?: string;
  emulatorId?: string;
  userProfile?: IUserProfile;
  scriptInstanceMeta?: IScriptInstanceMeta;
  viewport?: IViewport;
  timezoneId?: string;
  locale?: string;
}
