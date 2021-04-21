import IUserProfile from './IUserProfile';
import IViewport from './IViewport';

export default interface IBrowserEmulatorConfiguration {
  userProfile?: IUserProfile;
  viewport?: IViewport;
  timezoneId?: string;
  locale?: string;
}
