import { URL } from 'url';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { IPage } from '@unblocked-web/emulator-spec/browser/IPage';
import { IWorker } from '@unblocked-web/emulator-spec/browser/IWorker';
import IHttpResourceLoadDetails from '@unblocked-web/emulator-spec/net/IHttpResourceLoadDetails';
import IDnsSettings from '@unblocked-web/emulator-spec/net/IDnsSettings';
import ITcpSettings from '@unblocked-web/emulator-spec/net/ITcpSettings';
import ITlsSettings from '@unblocked-web/emulator-spec/net/ITlsSettings';
import { IInteractionGroups, IInteractionStep } from '@unblocked-web/emulator-spec/interact/IInteractions';
import IInteractionsHelper from '@unblocked-web/emulator-spec/interact/IInteractionsHelper';
import IPoint from '@unblocked-web/emulator-spec/browser/IPoint';
import ICorePlugin, {
  ICorePluginClass,
  IOnClientCommandMeta,
  ISessionSummary,
} from '@ulixee/hero-interfaces/ICorePlugin';
import requirePlugins from '@ulixee/hero-plugin-utils/lib/utils/requirePlugins';
import ICorePlugins from '@ulixee/hero-interfaces/ICorePlugins';
import ICorePluginCreateOptions from '@ulixee/hero-interfaces/ICorePluginCreateOptions';
import IBrowserEngine from '@unblocked-web/emulator-spec/browser/IBrowserEngine';
import {
  IBrowserEmulator,
  IBrowserEmulatorClass,
  IBrowserEmulatorConfig,
  ISelectBrowserMeta,
} from '@unblocked-web/emulator-spec/IBrowserEmulator';
import { IHumanEmulator, IHumanEmulatorClass } from '@unblocked-web/emulator-spec/IHumanEmulator';
import IDeviceProfile from '@unblocked-web/emulator-spec/browser/IDeviceProfile';
import IDevtoolsSession from '@unblocked-web/emulator-spec/browser/IDevtoolsSession';
import { PluginTypes } from '@ulixee/hero-interfaces/IPluginTypes';
import IHttp2ConnectSettings from '@unblocked-web/emulator-spec/net/IHttp2ConnectSettings';
import Core from '../index';
import IHttpSocketAgent from '@unblocked-web/emulator-spec/net/IHttpSocketAgent';
import IBrowserContext from '@unblocked-web/emulator-spec/browser/IBrowserContext';
import IBrowser from '@unblocked-web/emulator-spec/browser/IBrowser';
import IBrowserLaunchArgs from '@unblocked-web/emulator-spec/browser/IBrowserLaunchArgs';

const DefaultBrowserEmulatorId = '@unblocked-web/default-browser-emulator';
const DefaultHumanEmulatorId = '@unblocked-web/default-human-emulator';

interface IOptionsCreate {
  userAgentSelector?: string;
  deviceProfile?: IDeviceProfile;
  humanEmulatorId?: string;
  browserEmulatorId?: string;
  selectBrowserMeta?: ISelectBrowserMeta;
  dependencyMap?: IDependencyMap;
  corePluginPaths?: string[];
  getSessionSummary?: () => ISessionSummary;
}

interface IDependencyMap {
  [clientPluginId: string]: string[];
}

export default class CorePlugins implements ICorePlugins {
  public static corePluginClassesById: { [id: string]: ICorePluginClass } = {};

  public browserEngine: IBrowserEngine;
  public browserEmulator: IBrowserEmulator;
  public humanEmulator: IHumanEmulator;

  public get sessionSummary(): ISessionSummary {
    return this.getSessionSummary();
  }

  public readonly instances: ICorePlugin[] = [];

  public get corePlugins(): ICorePlugin[] {
    return this.instances.filter(x => {
      return x.id !== this.humanEmulator.id && x.id !== this.browserEmulator.id;
    });
  }

  private instanceById: { [id: string]: ICorePlugin } = {};
  private readonly createOptions: ICorePluginCreateOptions;
  private readonly logger: IBoundLog;
  private getSessionSummary: () => ISessionSummary;

  constructor(options: IOptionsCreate, logger: IBoundLog) {
    const {
      userAgentSelector,
      dependencyMap,
      corePluginPaths,
      browserEmulatorId = DefaultBrowserEmulatorId,
      humanEmulatorId = DefaultHumanEmulatorId,
      getSessionSummary,
    } = options;

    this.getSessionSummary =
      getSessionSummary ??
      (() => ({
        id: null,
        options: {},
      }));

    let BrowserEmulator = Core.pluginMap.browserEmulatorsById[browserEmulatorId];
    if (!BrowserEmulator) {
      BrowserEmulator = requirePlugins<IBrowserEmulatorClass>(
        browserEmulatorId,
        PluginTypes.BrowserEmulator,
      )[0];
    }
    if (!BrowserEmulator) throw new Error(`Browser emulator ${browserEmulatorId} was not found`);

    let HumanEmulator = Core.pluginMap.humanEmulatorsById[humanEmulatorId];
    if (!HumanEmulator) {
      HumanEmulator = requirePlugins<IHumanEmulatorClass>(
        humanEmulatorId,
        PluginTypes.HumanEmulator,
      )[0];
    }
    if (!HumanEmulator) throw new Error(`Human emulator ${humanEmulatorId} was not found`);

    const { browserEngine, userAgentOption } =
      options.selectBrowserMeta || BrowserEmulator.selectBrowserMeta(userAgentSelector);
    this.createOptions = {
      browserEngine,
      userAgentOption,
      logger,
      corePlugins: this,
      sessionSummary: this.sessionSummary,
      deviceProfile: options.deviceProfile,
    };
    this.browserEngine = browserEngine;
    this.logger = logger;

    this.browserEmulator = new BrowserEmulator(this.createOptions);
    this.addPluginInstance(this.browserEmulator);

    this.humanEmulator = new HumanEmulator(this.createOptions);
    this.addPluginInstance(this.humanEmulator);

    Object.values(Core.pluginMap.corePluginsById).forEach(x => this.use(x));

    if (Core.allowDynamicPluginLoading) {
      if (corePluginPaths) {
        this.loadCorePluginPaths(corePluginPaths);
      }
      if (dependencyMap) {
        this.loadDependencies(dependencyMap);
      }
    }
  }

  public cleanup(): void {
    this.getSessionSummary = () => null;
    this.instanceById = {};
    this.instances.length = 0;
    this.browserEngine = null;
    this.humanEmulator = null;
  }

  // BROWSER EMULATORS

  public configure(options: IBrowserEmulatorConfig): void {
    this.instances.filter(p => p.configure).forEach(p => p.configure(options));
  }

  public onDnsConfiguration(settings: IDnsSettings): void {
    this.instances.filter(p => p.onDnsConfiguration).forEach(p => p.onDnsConfiguration(settings));
  }

  public onTcpConfiguration(settings: ITcpSettings): void {
    this.instances.filter(p => p.onTcpConfiguration).forEach(p => p.onTcpConfiguration(settings));
  }

  public onTlsConfiguration(settings: ITlsSettings): void {
    this.instances.filter(p => p.onTlsConfiguration).forEach(p => p.onTlsConfiguration(settings));
  }

  public async onHttpAgentInitialized(agent: IHttpSocketAgent): Promise<void> {
    await Promise.all(
      this.instances
        .filter(p => p.onHttpAgentInitialized)
        .map(p => p.onHttpAgentInitialized(agent)),
    );
  }

  public async onNewBrowser(browser: IBrowser, launchArgs: IBrowserLaunchArgs): Promise<void> {
    await Promise.all(
      this.instances.filter(p => p.onNewBrowser).map(p => p.onNewBrowser(browser, launchArgs)),
    );
  }

  public async onNewPage(page: IPage): Promise<void> {
    await Promise.all(this.instances.filter(p => p.onNewPage).map(p => p.onNewPage(page)));
  }

  public async onNewWorker(worker: IWorker): Promise<void> {
    await Promise.all(this.instances.filter(p => p.onNewWorker).map(p => p.onNewWorker(worker)));
  }

  public async onNewBrowserContext(context: IBrowserContext): Promise<void> {
    await Promise.all(
      this.instances.filter(p => p.onNewBrowserContext).map(p => p.onNewBrowserContext(context)),
    );
  }

  public async onHttp2SessionConnect(
    resource: IHttpResourceLoadDetails,
    settings: IHttp2ConnectSettings,
  ): Promise<void> {
    await Promise.all(
      this.instances
        .filter(p => p.onHttp2SessionConnect)
        .map(p => p.onHttp2SessionConnect(resource, settings)),
    );
  }

  public async beforeHttpRequest(resource: IHttpResourceLoadDetails): Promise<void> {
    await Promise.all(
      this.instances.filter(p => p.beforeHttpRequest).map(p => p.beforeHttpRequest(resource)),
    );
  }

  public async beforeHttpResponse(resource: IHttpResourceLoadDetails): Promise<any> {
    await Promise.all(
      this.instances.filter(p => p.beforeHttpResponse).map(p => p.beforeHttpResponse(resource)),
    );
  }

  public websiteHasFirstPartyInteraction(url: URL): void {
    this.instances
      .filter(p => p.websiteHasFirstPartyInteraction)
      .forEach(p => p.websiteHasFirstPartyInteraction(url));
  }

  // HUMAN EMULATORS

  public async playInteractions(
    interactionGroups: IInteractionGroups,
    runFn: (interaction: IInteractionStep) => Promise<void>,
    helper: IInteractionsHelper,
  ): Promise<void> {
    const plugin = this.instances.filter(p => p.playInteractions).pop();
    if (plugin && plugin.playInteractions) {
      await plugin.playInteractions(interactionGroups, runFn, helper);
    } else {
      for (const interactionGroup of interactionGroups) {
        for (const interactionStep of interactionGroup) {
          await runFn(interactionStep);
        }
      }
    }
  }

  public async beforeEachInteractionStep(
    step: IInteractionStep,
    isMouseCommand: boolean,
  ): Promise<void> {
    for (const plugin of this.instances) {
      await plugin.beforeEachInteractionStep?.(step, isMouseCommand);
    }
  }

  public async afterInteractionGroups(): Promise<void> {
    for (const plugin of this.instances) {
      await plugin.afterInteractionGroups?.();
    }
  }

  public async adjustStartingMousePoint(point: IPoint, helper: IInteractionsHelper): Promise<void> {
    for (const plugin of this.instances) {
      await plugin.adjustStartingMousePoint?.(point, helper);
    }
  }

  // PLUGIN COMMANDS

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

  // MISCELLANEOUS

  public async onDevtoolsPanelAttached(devtoolsSession: IDevtoolsSession): Promise<any> {
    await Promise.all(
      this.instances
        .filter(p => p.onDevtoolsPanelAttached)
        .map(p => p.onDevtoolsPanelAttached(devtoolsSession)),
    );
  }

  public async onDevtoolsPanelDetached(devtoolsSession: IDevtoolsSession): Promise<any> {
    await Promise.all(
      this.instances
        .filter(p => p.onDevtoolsPanelDetached)
        .map(p => p.onDevtoolsPanelDetached(devtoolsSession)),
    );
  }

  // ADDING PLUGINS TO THE STACK

  public use(CorePlugin: ICorePluginClass): void {
    if (this.instanceById[CorePlugin.id]) return;
    this.addPluginInstance(
      new CorePlugin({ ...this.createOptions, sessionSummary: this.sessionSummary }),
    );
  }

  private addPluginInstance(corePlugin: ICorePlugin): void {
    this.instances.push(corePlugin);
    this.instanceById[corePlugin.id] = corePlugin;
  }

  private async require(corePluginId: string): Promise<ICorePluginClass> {
    if (!CorePlugins.corePluginClassesById[corePluginId]) {
      try {
        // eslint-disable-next-line global-require,import/no-dynamic-require
        const CorePlugin = await import(corePluginId);
        if (!CorePlugin) return;
        let CoreModule = CorePlugin.default || CorePlugin;
        if (Object.keys(CoreModule).length === 1) {
          CoreModule = CoreModule[Object.keys(CoreModule).pop()];
        }
        if (!CoreModule.id) {
          throw new Error('Your CorePlugin needs to have a static id property');
        }
        CorePlugins.corePluginClassesById[corePluginId] = CoreModule;
      } catch (error) {
        return;
      }
    }
    return CorePlugins.corePluginClassesById[corePluginId];
  }

  private loadDependencies(dependencyMap: IDependencyMap): void {
    for (const [clientPluginId, corePluginIds] of Object.entries(dependencyMap)) {
      for (const corePluginId of corePluginIds) {
        if (this.instanceById[corePluginId]) continue;
        if (Core.pluginMap.corePluginsById[corePluginId]) continue;
        this.logger.info(`Dynamically requiring ${corePluginId} requested by ${clientPluginId}`);
        const Plugin = requirePlugins<ICorePluginClass>(corePluginId, PluginTypes.CorePlugin)[0];
        if (!Plugin) throw new Error(`Could not find ${corePluginId}`);

        this.use(Plugin);
      }
    }
  }

  private loadCorePluginPaths(corePluginPaths: string[]): void {
    for (const corePluginPath of corePluginPaths) {
      if (Core.pluginMap.corePluginsById[corePluginPath]) continue;
      const Plugins = requirePlugins<ICorePluginClass>(corePluginPath, PluginTypes.CorePlugin);
      Plugins.forEach(Plugin => this.use(Plugin));
    }
  }
}
