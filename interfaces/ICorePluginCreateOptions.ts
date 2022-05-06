import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import ICorePlugins from './ICorePlugins';
import IDeviceProfile from '@bureau/interfaces/IDeviceProfile';
import { ISessionSummary } from './ICorePlugin';
import IBrowserEngine from '@bureau/interfaces/IBrowserEngine';
import IUserAgentOption from '@bureau/interfaces/IUserAgentOption';

export default interface ICorePluginCreateOptions {
  userAgentOption: IUserAgentOption;
  browserEngine: IBrowserEngine;
  corePlugins: ICorePlugins;
  sessionSummary: ISessionSummary;
  logger: IBoundLog;
  deviceProfile?: IDeviceProfile;
}
