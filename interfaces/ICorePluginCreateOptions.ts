import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import IEmulationProfile from '@unblocked-web/specifications/plugin/IEmulationProfile';
import ICorePlugins from './ICorePlugins';
import { ISessionSummary } from './ICorePlugin';

export default interface ICorePluginCreateOptions {
  emulationProfile: IEmulationProfile;
  corePlugins: ICorePlugins;
  sessionSummary: ISessionSummary;
  logger: IBoundLog;
}
