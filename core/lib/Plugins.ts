import { URL } from 'url';
import { IBoundLog } from '@secret-agent/interfaces/ILog';
import { ICoreExtender, IOnCommandMeta } from '@secret-agent/interfaces/IPluginCoreExtender';
import { IPuppetPage } from '@secret-agent/interfaces/IPuppetPage';
import { IPuppetWorker } from '@secret-agent/interfaces/IPuppetWorker';
import IHttpResourceLoadDetails from '@secret-agent/interfaces/IHttpResourceLoadDetails';
import IDnsSettings from '@secret-agent/interfaces/IDnsSettings';
import ITcpSettings from '@secret-agent/interfaces/ITcpSettings';
import ITlsSettings from '@secret-agent/interfaces/ITlsSettings';
import { IInteractionGroups, IInteractionStep } from '@secret-agent/interfaces/IInteractions';
import IInteractionsHelper from '@secret-agent/interfaces/IInteractionsHelper';
import IPoint from '@secret-agent/interfaces/IPoint';
import {
  IBrowserEmulator,
  IBrowserEmulatorConfig,
  ISelectBrowserMeta,
} from '@secret-agent/interfaces/IPluginBrowserEmulator';
import { IHumanEmulator } from '@secret-agent/interfaces/IPluginHumanEmulator';
import IPlugins from '@secret-agent/interfaces/IPlugins';
import IPlugin, { IPluginClass } from '@secret-agent/interfaces/IPlugin';
import IPluginCreateOptions from '@secret-agent/interfaces/IPluginCreateOptions';
import IBrowserEngine from '@secret-agent/interfaces/IBrowserEngine';
import { PluginTypes } from '@secret-agent/interfaces/IPluginTypes';
import Core from '../index';

const DefaultBrowserEmulatorId = 'default-browser-emulator';
const DefaultHumanEmulatorId = 'default-human-emulator';

interface IOptionsCreate {
  userAgentSelector?: string;
  humanEmulatorId?: string;
  browserEmulatorId?: string;
  selectBrowserMeta?: ISelectBrowserMeta;
  dependencyMap?: { [clientPluginId: string]: string[] };
}

export default class Plugins implements IPlugins {
  public static pluginClassesById: { [id: string]: IPluginClass } = {};

  public readonly browserEngine: IBrowserEngine;
  public readonly browserEmulator: IBrowserEmulator;
  public readonly humanEmulator: IHumanEmulator;

  private readonly instances: ICoreExtender[] = [];
  private readonly instanceById: { [id: string]: ICoreExtender } = {};
  private readonly createOptions: IPluginCreateOptions;
  private readonly logger: IBoundLog;

  constructor(options: IOptionsCreate, logger: IBoundLog) {
    const {
      userAgentSelector,
      dependencyMap,
      browserEmulatorId = DefaultBrowserEmulatorId,
      humanEmulatorId = DefaultHumanEmulatorId,
    } = options;

    const BrowserEmulator = Core.pluginMap.browserEmulatorsById[browserEmulatorId];
    if (!BrowserEmulator) throw new Error(`Browser emulator ${browserEmulatorId} was not found`);

    let HumanEmulator = Core.pluginMap.humanEmulatorsById[humanEmulatorId];
    // Backwards compatibility for 1.4.X > 1.5.0
    if (!HumanEmulator && humanEmulatorId === 'basic') {
      HumanEmulator = Core.pluginMap.humanEmulatorsById[DefaultHumanEmulatorId];
    }
    if (!HumanEmulator) throw new Error(`Human emulator ${humanEmulatorId} was not found`);

    const { browserEngine, userAgentOption } =
      options.selectBrowserMeta || BrowserEmulator.selectBrowserMeta(userAgentSelector);
    this.createOptions = { browserEngine, logger, plugins: this };
    this.browserEngine = browserEngine;
    this.logger = logger;

    this.browserEmulator = new BrowserEmulator(this.createOptions, userAgentOption);
    this.addPluginInstance(this.browserEmulator);

    this.humanEmulator = new HumanEmulator(this.createOptions);
    this.addPluginInstance(this.humanEmulator);

    Core.pluginMap.coreExtenders.forEach(x => this.use(x));

    if (dependencyMap && Core.allowDynamicPluginDependencies) {
      Object.entries(dependencyMap).forEach(([clientPluginId, dependentPluginIds]) => {
        dependentPluginIds.forEach(pluginId => {
          if (this.instanceById[pluginId]) return;
          this.logger.info(`Dynamically using ${pluginId} required by ${clientPluginId}`);
          const Plugin = this.require(pluginId);
          if (!Plugin) {
            this.logger.warn(`Could not find ${pluginId} required by ${clientPluginId}`);
            return;
          }
          const CoreExtender = (Plugin as any).CoreExtender || Plugin;
          if (CoreExtender.pluginType !== PluginTypes.CoreExtender) {
            this.logger.warn(`Could not use ${pluginId} because it's not a CoreExtender`);
            return;
          }
          this.use(CoreExtender);
        });
      });
    }
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

  public async onNewPuppetPage(page: IPuppetPage): Promise<void> {
    await Promise.all(
      this.instances.filter(p => p.onNewPuppetPage).map(p => p.onNewPuppetPage(page)),
    );
  }

  public async onNewPuppetWorker(worker: IPuppetWorker): Promise<void> {
    await Promise.all(
      this.instances.filter(p => p.onNewPuppetWorker).map(p => p.onNewPuppetWorker(worker)),
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
    helper?: IInteractionsHelper,
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

  public async getStartingMousePoint(helper?: IInteractionsHelper): Promise<IPoint> {
    const plugin = this.instances.filter(p => p.getStartingMousePoint).pop();
    if (plugin && plugin.getStartingMousePoint) {
      return await plugin.getStartingMousePoint(helper);
    }
  }

  // PLUGIN COMMANDS

  public async onPluginCommand(
    sendToPluginId: string,
    commandMeta: IOnCommandMeta,
    args: any[],
  ): Promise<any> {
    const plugin = this.instanceById[sendToPluginId];
    if (plugin && plugin.onCommand) {
      return await plugin.onCommand(commandMeta, ...args);
    }
    this.logger.warn(`Plugin (${sendToPluginId}) could not be found for command`);
  }

  // ADDING PLUGINS TO THE STACK

  public use(Plugin: IPluginClass) {
    if (this.instanceById[Plugin.id]) return;
    this.addPluginInstance(new Plugin(this.createOptions));
  }

  private addPluginInstance(plugin: IPlugin) {
    this.instances.push(plugin);
    this.instanceById[plugin.id] = plugin;
  }

  private require(pluginId: string): IPluginClass {
    if (!Plugins.pluginClassesById[pluginId]) {
      try {
        // eslint-disable-next-line global-require,import/no-dynamic-require
        const Plugin = require(pluginId);
        if (!Plugin) return;
        Plugins.pluginClassesById[pluginId] = Plugin;
      } catch (error) {
        return;
      }
    }
    return Plugins.pluginClassesById[pluginId];
  }
}
