import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import IBrowserEngine from './IBrowserEngine';
import ICorePlugins from './ICorePlugins';
import IUserAgentOption from './IUserAgentOption';
import IDeviceProfile from './IDeviceProfile';

export default interface ICorePluginCreateOptions {
  userAgentOption: IUserAgentOption;
  browserEngine: IBrowserEngine;
  corePlugins: ICorePlugins;
  logger: IBoundLog;
  deviceProfile?: IDeviceProfile;
}
