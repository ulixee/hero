import { ICookie } from '@unblocked-web/specifications/agent/net/ICookie';
import IDomStorage from '@unblocked-web/specifications/agent/browser/IDomStorage';
import IDeviceProfile from '@unblocked-web/specifications/plugin/IDeviceProfile';

export default interface IUserProfile {
  cookies?: ICookie[];
  storage?: IDomStorage;
  userAgentString?: string;
  deviceProfile?: IDeviceProfile;
}
