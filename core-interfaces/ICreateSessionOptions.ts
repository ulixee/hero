import IUserProfile from './IUserProfile';
import ISessionOptions from './ISessionOptions';
import IScriptInstanceMeta from './IScriptInstanceMeta';

export default interface ICreateSessionOptions extends ISessionOptions {
  sessionName?: string;
  emulatorId?: string;
  userProfile?: IUserProfile;
  scriptInstanceMeta?: IScriptInstanceMeta;
}
