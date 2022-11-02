import { ICookie } from '@ulixee/unblocked-specification/agent/net/ICookie';
import IDomStorage from '@ulixee/unblocked-specification/agent/browser/IDomStorage';
import IDeviceProfile from '@ulixee/unblocked-specification/plugin/IDeviceProfile';

export default interface IUserProfile {
  cookies?: ICookie[];
  storage?: IDomStorage;
  userAgentString?: string;
  deviceProfile?: IDeviceProfile;
}
