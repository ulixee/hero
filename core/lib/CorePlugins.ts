import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import ICorePlugin, {
  ICorePluginClass,
  IOnClientCommandMeta,
  ISessionSummary,
} from '@ulixee/hero-interfaces/ICorePlugin';
import requirePlugins from '@ulixee/hero-plugin-utils/lib/utils/requirePlugins';
import ICorePlugins from '@ulixee/hero-interfaces/ICorePlugins';
import { PluginTypes } from '@ulixee/hero-interfaces/IPluginTypes';
import IEmulationProfile from '@ulixee/unblocked-specification/plugin/IEmulationProfile';
import Agent from '@ulixee/unblocked-agent/lib/Agent';
import { PluginConfigs } from '@ulixee/unblocked-specification/plugin/IUnblockedPlugin';
import Core from '../index';

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
  public get sessionSummary(): ISessionSummary {
    return this.getSessionSummary();
  }

  public get instances(): ICorePlugin[] {
    return Object.values(this.instanceById);
  }

  private instanceById: { [id: string]: ICorePlugin } = {};
  private readonly logger: IBoundLog;
  private agent: Agent;
  private getSessionSummary: IOptionsCreate['getSessionSummary'];
  private pluginConfigs: PluginConfigs;

  constructor(
    agent: Agent,
    options: IOptionsCreate,
    private corePluginsById: { [id: string]: ICorePluginClass },
  ) {
    const { dependencyMap, corePluginPaths, getSessionSummary } = options;
    this.pluginConfigs = options.pluginConfigs ?? {};
    this.agent = agent;

    if (getSessionSummary) this.getSessionSummary = getSessionSummary;
    else
      this.getSessionSummary = () => ({
        id: null,
        options: {},
      });

    this.logger = agent.logger.createChild(module);

    for (const plugin of Object.values(corePluginsById)) {
      const config = this.pluginConfigs[plugin.id];
      // true shortcircuits and skips shouldActivate check, we also skip running the shouldActivate function.
      const shouldActivate = (): boolean | undefined =>
        plugin.shouldActivate?.(agent.emulationProfile, getSessionSummary(), config);
      if (config !== true && (config === false || shouldActivate() === false)) {
        continue;
      }
      this.use(plugin);
    }

    if (Core.allowDynamicPluginLoading) {
      if (corePluginPaths) {
        this.loadCorePluginPaths(corePluginPaths);
      }
      if (dependencyMap) {
        this.loadDependencies(dependencyMap);
      }
    }
    this.configure(agent.emulationProfile);
  }

  public cleanup(): void {
    this.getSessionSummary = () => null;
    this.instanceById = {};
    this.agent = null;
  }

  public configure(options: IEmulationProfile): void {
    this.instances.forEach(p => p.configure?.(options));
  }

  public async onPluginCommand(
    toPluginId: string,
    commandMeta: Pick<IOnClientCommandMeta, 'page' | 'frame'>,
    args: any[],
  ): Promise<any> {
    const plugin = this.instanceById[toPluginId];
    if (plugin && plugin.onClientCommand) {
      return await plugin.onClientCommand(
        {
          page: commandMeta.page,
          frame: commandMeta.frame,
        },
        ...args,
      );
    }
    this.logger.warn(`Plugin (${toPluginId}) could not be found for command`);
  }

  // ADDING PLUGINS TO THE STACK

  public use(CorePlugin: ICorePluginClass): void {
    if (this.instanceById[CorePlugin.id]) return;

    const config = this.pluginConfigs[CorePlugin.id];;
    const corePlugin = new CorePlugin({
      emulationProfile: this.agent.emulationProfile,
      logger: this.logger,
      corePlugins: this,
      sessionSummary: this.sessionSummary,
      customConfig: typeof config === 'boolean' ? undefined : config,
    });
    this.instances.push(corePlugin);
    this.instanceById[corePlugin.id] = corePlugin;
    this.agent.hook(corePlugin);
  }

  private loadDependencies(dependencyMap: IDependencyMap): void {
    for (const [clientPluginId, corePluginIds] of Object.entries(dependencyMap)) {
      for (const corePluginId of corePluginIds) {
        if (this.instanceById[corePluginId]) continue;
        if (this.corePluginsById[corePluginId]) continue;
        this.logger.info(`Dynamically requiring ${corePluginId} requested by ${clientPluginId}`);
        const Plugin = requirePlugins<ICorePluginClass>(corePluginId, PluginTypes.CorePlugin)[0];
        if (!Plugin) throw new Error(`Could not find ${corePluginId}`);

        this.use(Plugin);
      }
    }
  }

  private loadCorePluginPaths(corePluginPaths: string[]): void {
    for (const corePluginPath of corePluginPaths) {
      if (this.corePluginsById[corePluginPath]) continue;
      const Plugins = requirePlugins<ICorePluginClass>(corePluginPath, PluginTypes.CorePlugin);
      Plugins.forEach(Plugin => this.use(Plugin));
    }
  }
}
