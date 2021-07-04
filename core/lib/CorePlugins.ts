import { URL } from 'url';
import { IBoundLog } from '@secret-agent/interfaces/ILog';
import { IPuppetPage } from '@secret-agent/interfaces/IPuppetPage';
import { IPuppetWorker } from '@secret-agent/interfaces/IPuppetWorker';
import IHttpResourceLoadDetails from '@secret-agent/interfaces/IHttpResourceLoadDetails';
import IDnsSettings from '@secret-agent/interfaces/IDnsSettings';
import ITcpSettings from '@secret-agent/interfaces/ITcpSettings';
import ITlsSettings from '@secret-agent/interfaces/ITlsSettings';
import { IInteractionGroups, IInteractionStep } from '@secret-agent/interfaces/IInteractions';
import IInteractionsHelper from '@secret-agent/interfaces/IInteractionsHelper';
import IPoint from '@secret-agent/interfaces/IPoint';
import ICorePlugin, {
  IHumanEmulator,
  IBrowserEmulator,
  IBrowserEmulatorConfig,
  ISelectBrowserMeta,
  ICorePluginClass,
  IOnClientCommandMeta,
} from '@secret-agent/interfaces/ICorePlugin';
import ICorePlugins from '@secret-agent/interfaces/ICorePlugins';
import ICorePluginCreateOptions from '@secret-agent/interfaces/ICorePluginCreateOptions';
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

export default class CorePlugins implements ICorePlugins {
  public static corePluginClassesById: { [id: string]: ICorePluginClass } = {};

  public readonly browserEngine: IBrowserEngine;
  public readonly browserEmulator: IBrowserEmulator;
  public readonly humanEmulator: IHumanEmulator;

  private readonly instances: ICorePlugin[] = [];
  private readonly instanceById: { [id: string]: ICorePlugin } = {};
  private readonly createOptions: ICorePluginCreateOptions;
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
    this.createOptions = { browserEngine, userAgentOption, logger, corePlugins: this };
    this.browserEngine = browserEngine;
    this.logger = logger;

    this.browserEmulator = new BrowserEmulator(this.createOptions);
    this.addPluginInstance(this.browserEmulator);

    this.humanEmulator = new HumanEmulator(this.createOptions);
    this.addPluginInstance(this.humanEmulator);

    Core.pluginMap.corePlugins.forEach(x => this.use(x));

    if (dependencyMap && Core.allowDynamicPluginDependencies) {
      Object.entries(dependencyMap).forEach(([clientPluginId, dependentPluginIds]) => {
        dependentPluginIds.forEach(corePluginId => {
          if (this.instanceById[corePluginId]) return;
          this.logger.info(`Dynamically using ${corePluginId} required by ${clientPluginId}`);
          const PluginObject = this.require(corePluginId);
          if (!PluginObject) {
            this.logger.warn(`Could not find ${corePluginId} required by ${clientPluginId}`);
            return;
          }
          const CorePlugin = (PluginObject as any).CorePlugin || PluginObject;
          if (CorePlugin.type !== PluginTypes.CorePlugin) {
            this.logger.warn(`Could not use ${corePluginId} because it's not a CorePlugin`);
            return;
          }
          this.use(CorePlugin);
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
    toPluginId: string,
    commandMeta: IOnClientCommandMeta,
    args: any[],
  ): Promise<any> {
    const plugin = this.instanceById[toPluginId];
    if (plugin && plugin.onClientCommand) {
      return await plugin.onClientCommand(commandMeta, ...args);
    }
    this.logger.warn(`Plugin (${toPluginId}) could not be found for command`);
  }

  // ADDING PLUGINS TO THE STACK

  public use(CorePlugin: ICorePluginClass) {
    if (this.instanceById[CorePlugin.id]) return;
    this.addPluginInstance(new CorePlugin(this.createOptions));
  }

  private addPluginInstance(corePlugin: ICorePlugin) {
    this.instances.push(corePlugin);
    this.instanceById[corePlugin.id] = corePlugin;
  }

  private require(corePluginId: string): ICorePluginClass {
    if (!CorePlugins.corePluginClassesById[corePluginId]) {
      try {
        // eslint-disable-next-line global-require,import/no-dynamic-require
        const CorePlugin = require(corePluginId);
        if (!CorePlugin) return;
        CorePlugins.corePluginClassesById[corePluginId] = CorePlugin.default || CorePlugin;
      } catch (error) {
        return;
      }
    }
    return CorePlugins.corePluginClassesById[corePluginId];
  }
}
