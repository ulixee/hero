import { ICookie } from '@unblocked-web/emulator-spec/net/ICookie';
import IDomStorage from '@unblocked-web/emulator-spec/browser/IDomStorage';
import IDeviceProfile from '@unblocked-web/emulator-spec/browser/IDeviceProfile';

export default interface IUserProfile {
  cookies?: ICookie[];
  storage?: IDomStorage;
  userAgentString?: string;
  deviceProfile?: IDeviceProfile;
}
