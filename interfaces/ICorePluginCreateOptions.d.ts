import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import IEmulationProfile from '@ulixee/unblocked-specification/plugin/IEmulationProfile';
import { PluginCustomConfig } from '@ulixee/unblocked-specification/plugin/IUnblockedPlugin';
import ICorePlugins from './ICorePlugins';
import { ISessionSummary } from './ICorePlugin';
export default interface ICorePluginCreateOptions<C extends object = any> {
    emulationProfile: IEmulationProfile;
    corePlugins: ICorePlugins;
    sessionSummary: ISessionSummary;
    logger: IBoundLog;
    customConfig?: PluginCustomConfig<C>;
}
