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
  IBrowserEmulatorConfig, ISelectBrowserMeta
} from "@secret-agent/interfaces/IPluginBrowserEmulator";
import { IHumanEmulator } from '@secret-agent/interfaces/IPluginHumanEmulator';
import IPlugins from '@secret-agent/interfaces/IPlugins';
import IPlugin, { IPluginClass } from '@secret-agent/interfaces/IPlugin';
import IPluginCreateOptions from '@secret-agent/interfaces/IPluginCreateOptions';
import IBrowserEngine from '@secret-agent/interfaces/IBrowserEngine';
import Core from '../index';

const DefaultBrowserEmulatorId = 'default-browser-emulator';
const DefaultHumanEmulatorId = 'default-human-emulator';

interface IOptionsCreate {
  userAgentSelector?: string;
  humanEmulatorId?: string;
  browserEmulatorId?: string;
  selectBrowserMeta?: ISelectBrowserMeta;
}

export default class Plugins implements IPlugins {
  public readonly browserEngine: IBrowserEngine;
  public readonly browserEmulator: IBrowserEmulator;
  public readonly humanEmulator: IHumanEmulator;

  private readonly instances: ICoreExtender[] = [];
  private readonly instanceById: { [id: string]: ICoreExtender } = {};
  private readonly createOptions: IPluginCreateOptions;

  constructor(options: IOptionsCreate, logger: IBoundLog) {
    const {
      userAgentSelector,
      browserEmulatorId = DefaultBrowserEmulatorId,
      humanEmulatorId = DefaultHumanEmulatorId,
    } = options;

    const BrowserEmulator = Core.pluginMap.browserEmulatorsById[browserEmulatorId];
    if (!BrowserEmulator) throw new Error(`Browser emulator ${browserEmulatorId} was not found`);

    const HumanEmulator = Core.pluginMap.humanEmulatorsById[humanEmulatorId];
    if (!HumanEmulator) throw new Error(`Human emulator ${humanEmulatorId} was not found`);

    const { browserEngine, userAgentOption } = options.selectBrowserMeta || BrowserEmulator.selectBrowserMeta(userAgentSelector);
    this.createOptions = { browserEngine, logger, plugins: this };
    this.browserEngine = browserEngine;

    this.browserEmulator = new BrowserEmulator(this.createOptions, userAgentOption);
    this.addPluginInstance(this.browserEmulator);

    this.humanEmulator = new HumanEmulator(this.createOptions);
    this.addPluginInstance(this.humanEmulator);
    Core.pluginMap.coreExtenders.forEach(x => this.use(x));
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
      console.log(`USING plugin.playInteractions (${plugin.id})`);
      await plugin.playInteractions(interactionGroups, runFn, helper);
      console.log('FINISHED plugin.playInteractions');
    } else {
      console.log('NOT USING plugin.playInteractions');
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

  public async onPluginCommand(pluginId: string, commandMeta: IOnCommandMeta, args: any[]) {
    const plugin = this.instanceById[pluginId];
    if (plugin && plugin.onCommand) {
      return await plugin.onCommand(commandMeta, ...args);
    }
  }

  // ADDING PLUGINS TO THE STACK

  public use(Plugin: IPluginClass) {
    this.addPluginInstance(new Plugin(this.createOptions));
  }

  private addPluginInstance(plugin: IPlugin) {
    this.instances.push(plugin);
    this.instanceById[plugin.id] = plugin;
  }
}
