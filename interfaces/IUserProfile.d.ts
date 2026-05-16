import IDomStorage from '@ulixee/unblocked-specification/agent/browser/IDomStorage';
import { ICookie } from '@ulixee/unblocked-specification/agent/net/ICookie';
import IDeviceProfile from '@ulixee/unblocked-specification/plugin/IDeviceProfile';
import IGeolocation from '@ulixee/unblocked-specification/plugin/IGeolocation';
import IUserAgentOption from '@ulixee/unblocked-specification/plugin/IUserAgentOption';
export default interface IUserProfile {
    cookies?: ICookie[];
    storage?: IDomStorage;
    userAgentString?: string;
    userAgent?: IUserAgentOption;
    timezoneId?: string;
    locale?: string;
    geolocation?: IGeolocation;
    deviceProfile?: IDeviceProfile;
}
