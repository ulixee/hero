import { ICookie } from './ICookie';
import IDomStorage from './IDomStorage';
import IDeviceProfile from './IDeviceProfile';

export default interface IUserProfile {
  cookies?: ICookie[];
  storage?: IDomStorage;
  userAgentString?: string;
  deviceProfile?: IDeviceProfile;
}
