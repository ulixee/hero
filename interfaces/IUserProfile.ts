import { ICookie } from '@bureau/interfaces/ICookie';
import IDomStorage from '@bureau/interfaces/IDomStorage';
import IDeviceProfile from '@bureau/interfaces/IDeviceProfile';

export default interface IUserProfile {
  cookies?: ICookie[];
  storage?: IDomStorage;
  userAgentString?: string;
  deviceProfile?: IDeviceProfile;
}
