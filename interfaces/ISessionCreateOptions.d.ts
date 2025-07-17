import { IEmulationOptions } from '@ulixee/unblocked-specification/plugin/IEmulationProfile';
import { IUnblockedPluginClass, PluginConfigs } from '@ulixee/unblocked-specification/plugin/IUnblockedPlugin';
import IUserProfile from './IUserProfile';
import ISessionOptions from './ISessionOptions';
import IScriptInvocationMeta from './IScriptInvocationMeta';
export default interface ISessionCreateOptions extends ISessionOptions, IEmulationOptions {
    sessionId?: string;
    sessionName?: string;
    sessionKeepAlive?: boolean;
    sessionPersistence?: boolean;
    sessionDbDirectory?: string;
    resumeSessionId?: string;
    resumeSessionStartLocation?: 'currentLocation' | 'sessionStart';
    replaySessionId?: string;
    mode?: 'development' | 'multiverse' | 'production' | 'timetravel' | 'browserless';
    userAgent?: string;
    scriptInvocationMeta?: IScriptInvocationMeta;
    userProfile?: IUserProfile;
    input?: any;
    dependencyMap?: {
        [clientPluginId: string]: string[];
    };
    corePluginPaths?: string[];
    showChrome?: boolean;
    showChromeAlive?: boolean;
    desktopConnectionId?: string;
    showChromeInteractions?: boolean;
    pluginConfigs?: PluginConfigs;
    unblockedPlugins?: IUnblockedPluginClass[];
}
