import IEmulationProfile from '@ulixee/unblocked-specification/plugin/IEmulationProfile';
import IUnblockedPlugins from '@ulixee/unblocked-specification/plugin/IUnblockedPlugins';
import IUnblockedPlugin, {
  IUnblockedPluginClass,
} from '@ulixee/unblocked-specification/plugin/IUnblockedPlugin';
import { URL } from 'url';
import {
  IInteractionGroups,
  IInteractionStep,
} from '@ulixee/unblocked-specification/agent/interact/IInteractions';
import IInteractionsHelper from '@ulixee/unblocked-specification/agent/interact/IInteractionsHelper';
import IHttpResourceLoadDetails from '@ulixee/unblocked-specification/agent/net/IHttpResourceLoadDetails';
import IHttp2ConnectSettings from '@ulixee/unblocked-specification/agent/net/IHttp2ConnectSettings';
import IBrowserContext from '@ulixee/unblocked-specification/agent/browser/IBrowserContext';
import { IWorker } from '@ulixee/unblocked-specification/agent/browser/IWorker';
import { IPage } from '@ulixee/unblocked-specification/agent/browser/IPage';
import IBrowser from '@ulixee/unblocked-specification/agent/browser/IBrowser';
import IBrowserLaunchArgs from '@ulixee/unblocked-specification/agent/browser/IBrowserLaunchArgs';
import IHttpSocketAgent from '@ulixee/unblocked-specification/agent/net/IHttpSocketAgent';
import ITlsSettings from '@ulixee/unblocked-specification/agent/net/ITlsSettings';
import ITcpSettings from '@ulixee/unblocked-specification/agent/net/ITcpSettings';
import IDnsSettings from '@ulixee/unblocked-specification/agent/net/IDnsSettings';
import IPoint from '@ulixee/unblocked-specification/agent/browser/IPoint';
import IDevtoolsSession from '@ulixee/unblocked-specification/agent/browser/IDevtoolsSession';
import ChromeApp from '@ulixee/chrome-app';
import { IHooksProvider } from '@ulixee/unblocked-specification/agent/hooks/IHooks';
import { IFrame } from '@ulixee/unblocked-specification/agent/browser/IFrame';
import ChromeEngine from './ChromeEngine';
import Interactor from './Interactor';
import IResourceType from '@ulixee/unblocked-specification/agent/net/IResourceType';

type ICallbackFn = (...args: any[]) => Promise<void> | void;

export default class Plugins implements IUnblockedPlugins {
  public profile: IEmulationProfile = {};
  public isStarted = false;

  public get hasHooks(): boolean {
    for (const list of Object.values(this.hooksByName)) if (list.length) return true;
    return false;
  }

  public readonly instances: IUnblockedPlugin[] = [];

  private hooksByName: Record<keyof IUnblockedPlugin, ICallbackFn[]> = {
    configure: [],
    addDomOverride: [],
    playInteractions: [],
    adjustStartingMousePoint: [],
    onNewBrowser: [],
    onNewBrowserContext: [],
    onDevtoolsPanelAttached: [],
    onNewPage: [],
    onNewWorker: [],
    onDevtoolsPanelDetached: [],
    onDnsConfiguration: [],
    onTcpConfiguration: [],
    onTlsConfiguration: [],
    onHttpAgentInitialized: [],
    onHttp2SessionConnect: [],
    shouldBlockRequest: [],
    beforeHttpRequest: [],
    beforeHttpResponse: [],
    websiteHasFirstPartyInteraction: [],
  };

  constructor(emulationProfile: IEmulationProfile, pluginClasses: IUnblockedPluginClass[]) {
    this.profile = emulationProfile ?? {};
    this.profile.options ??= {};
    Object.assign(this.profile, this.profile.options);

    if (this.profile.browserEngine instanceof ChromeApp) {
      this.profile.browserEngine = new ChromeEngine(this.profile.browserEngine);
    }

    if (pluginClasses?.length) {
      const PluginClasses = pluginClasses.filter(x => x.shouldActivate?.(this.profile) ?? true);
      for (const Plugin of PluginClasses) {
        const plugin = new Plugin(this.profile);
        this.instances.push(plugin);
        this.hook(plugin, false);
      }
    }

    if (!this.profile.browserEngine && !pluginClasses?.length) {
      try {
        this.profile.browserEngine = ChromeEngine.default();
      } catch (e) {
        this.profile.logger?.warn('Default Chrome Browser could not be found', {
          packageId: ChromeEngine.defaultPackageName,
        });
      }
    }

    void this.configure(this.profile).catch(() => null);
  }

  public hook(hooksToAdd: IHooksProvider, runConfigure = true): void {
    for (const name in this.hooksByName) {
      if (!(name in hooksToAdd)) {
        continue;
      }
      const callbackFn = hooksToAdd[name].bind(hooksToAdd);
      this.hooksByName[name].push(callbackFn);
      if (runConfigure && name === 'configure' && !this.isStarted) {
        callbackFn(this.profile);
      }
    }
  }

  public addDomOverride(
    runOn: 'page' | 'worker',
    script: string,
    args: Record<string, any> & { callbackName?: string },
    callback?: (data: string, frame: IFrame) => any,
  ): boolean {
    // delegate to first plugin implementing addDomOverride
    for (const plugin of this.instances) {
      if (plugin.addDomOverride?.(runOn, script, args, callback)) {
        return true;
      }
    }
    return false;
  }

  // INTERACTIONS

  public async playInteractions(
    interactionGroups: IInteractionGroups,
    runFn: (interaction: IInteractionStep) => Promise<void>,
    helper: IInteractionsHelper,
  ): Promise<void> {
    if (this.hooksByName.playInteractions.length) {
      const playFn =
        this.hooksByName.playInteractions[this.hooksByName.playInteractions.length - 1];
      await playFn(interactionGroups, runFn, helper);
    } else {
      await Interactor.defaultPlayInteractions(interactionGroups, runFn);
    }
  }

  public async adjustStartingMousePoint(point: IPoint, helper: IInteractionsHelper): Promise<void> {
    for (const fn of this.hooksByName.adjustStartingMousePoint) {
      await fn(point, helper);
    }
  }

  // BROWSER EMULATORS

  public async configure(profile: IEmulationProfile): Promise<void> {
    await Promise.all(this.hooksByName.configure.map(fn => fn(profile)));
  }

  public async onNewBrowser(browser: IBrowser, launchArgs: IBrowserLaunchArgs): Promise<void> {
    this.isStarted = true;
    await Promise.all(this.hooksByName.onNewBrowser.map(fn => fn(browser, launchArgs)));
  }

  public async onNewPage(page: IPage): Promise<void> {
    await Promise.all(this.hooksByName.onNewPage.map(fn => fn(page)));
  }

  public async onNewWorker(worker: IWorker): Promise<void> {
    await Promise.all(this.hooksByName.onNewWorker.map(fn => fn(worker)));
  }

  public async onNewBrowserContext(context: IBrowserContext): Promise<void> {
    this.isStarted = true;
    await Promise.all(this.hooksByName.onNewBrowserContext.map(fn => fn(context)));
  }

  public async onDevtoolsPanelAttached(devtoolsSession: IDevtoolsSession): Promise<any> {
    await Promise.all(this.hooksByName.onDevtoolsPanelAttached.map(fn => fn(devtoolsSession)));
  }

  public async onDevtoolsPanelDetached(devtoolsSession: IDevtoolsSession): Promise<any> {
    await Promise.all(this.hooksByName.onDevtoolsPanelDetached.map(fn => fn(devtoolsSession)));
  }

  // NETWORK

  public onDnsConfiguration(settings: IDnsSettings): void {
    for (const fn of this.hooksByName.onDnsConfiguration) void fn(settings);
  }

  public onTcpConfiguration(settings: ITcpSettings): void {
    for (const fn of this.hooksByName.onTcpConfiguration) void fn(settings);
  }

  public onTlsConfiguration(settings: ITlsSettings): void {
    for (const fn of this.hooksByName.onTlsConfiguration) void fn(settings);
  }

  public async onHttpAgentInitialized(agent: IHttpSocketAgent): Promise<void> {
    await Promise.all(this.hooksByName.onHttpAgentInitialized.map(fn => fn(agent)));
  }

  public async onHttp2SessionConnect(
    resource: IHttpResourceLoadDetails,
    settings: IHttp2ConnectSettings,
  ): Promise<void> {
    await Promise.all(this.hooksByName.onHttp2SessionConnect.map(fn => fn(resource, settings)));
  }

  public shouldBlockRequest(url: string, resourceTypeIfKnown?: IResourceType): boolean {
    for (const hook of this.hooksByName.shouldBlockRequest) {
      if (hook(url, resourceTypeIfKnown)) return true;
    }
    return false;
  }

  public async beforeHttpRequest(resource: IHttpResourceLoadDetails): Promise<void> {
    await Promise.all(this.hooksByName.beforeHttpRequest.map(fn => fn(resource)));
  }

  public async beforeHttpResponse(resource: IHttpResourceLoadDetails): Promise<any> {
    await Promise.all(this.hooksByName.beforeHttpResponse.map(fn => fn(resource)));
  }

  public websiteHasFirstPartyInteraction(url: URL): void {
    for (const fn of this.hooksByName.websiteHasFirstPartyInteraction) void fn(url);
  }
}
