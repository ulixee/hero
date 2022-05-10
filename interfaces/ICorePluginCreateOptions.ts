import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import ICorePlugins from './ICorePlugins';
import IDeviceProfile from '@unblocked-web/emulator-spec/browser/IDeviceProfile';
import { ISessionSummary } from './ICorePlugin';
import IBrowserEngine from '@unblocked-web/emulator-spec/browser/IBrowserEngine';
import IUserAgentOption from '@unblocked-web/emulator-spec/browser/IUserAgentOption';

export default interface ICorePluginCreateOptions {
  userAgentOption: IUserAgentOption;
  browserEngine: IBrowserEngine;
  corePlugins: ICorePlugins;
  sessionSummary: ISessionSummary;
  logger: IBoundLog;
  deviceProfile?: IDeviceProfile;
}
