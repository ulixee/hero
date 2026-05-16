import ICorePlugin, { ICorePluginClass, IOnClientCommandMeta, ISessionSummary } from '@ulixee/hero-interfaces/ICorePlugin';
import ICorePlugins from '@ulixee/hero-interfaces/ICorePlugins';
import IEmulationProfile from '@ulixee/unblocked-specification/plugin/IEmulationProfile';
import Agent from '@ulixee/unblocked-agent/lib/Agent';
import { PluginConfigs } from '@ulixee/unblocked-specification/plugin/IUnblockedPlugin';
interface IOptionsCreate {
    dependencyMap?: IDependencyMap;
    corePluginPaths?: string[];
    getSessionSummary?: () => ISessionSummary;
    pluginConfigs?: PluginConfigs;
}
interface IDependencyMap {
    [clientPluginId: string]: string[];
}
export default class CorePlugins implements ICorePlugins {
    private corePluginsById;
    get sessionSummary(): ISessionSummary;
    get instances(): ICorePlugin[];
    private instanceById;
    private readonly logger;
    private agent;
    private getSessionSummary;
    private pluginConfigs;
    constructor(agent: Agent, options: IOptionsCreate, corePluginsById: {
        [id: string]: ICorePluginClass;
    });
    cleanup(): void;
    configure(options: IEmulationProfile): void;
    onPluginCommand(toPluginId: string, commandMeta: Pick<IOnClientCommandMeta, 'page' | 'frame'>, args: any[]): Promise<any>;
    use(CorePlugin: ICorePluginClass): void;
    private loadDependencies;
    private loadCorePluginPaths;
}
export {};
