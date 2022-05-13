import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import ICorePlugins from './ICorePlugins';
import { ISessionSummary } from './ICorePlugin';
import IEmulationProfile from '@unblocked-web/specifications/plugin/IEmulationProfile';

export default interface ICorePluginCreateOptions {
  emulationProfile: IEmulationProfile;
  corePlugins: ICorePlugins;
  sessionSummary: ISessionSummary;
  logger: IBoundLog;
}
