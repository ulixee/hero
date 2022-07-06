import * as Util from 'util';
import { BlockedResourceType } from '@ulixee/hero-interfaces/ITabOptions';
import inspectInstanceProperties from 'awaited-dom/base/inspectInstanceProperties';
import { bindFunctions } from '@ulixee/commons/lib/utils';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import SuperDocument from 'awaited-dom/impl/super-klasses/SuperDocument';
import IDomStorage from '@unblocked-web/specifications/agent/browser/IDomStorage';
import IUserProfile from '@ulixee/hero-interfaces/IUserProfile';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import Response from 'awaited-dom/impl/official-klasses/Response';
import { ISuperElement, ISuperNode, ISuperNodeList } from 'awaited-dom/base/interfaces/super';
import IWaitForResourceOptions from '@ulixee/hero-interfaces/IWaitForResourceOptions';
import IWaitForElementOptions from '@ulixee/hero-interfaces/IWaitForElementOptions';
import {
  ILoadStatus,
  ILocationTrigger,
} from '@unblocked-web/specifications/agent/browser/Location';
import Request from 'awaited-dom/impl/official-klasses/Request';
import IWaitForOptions from '@ulixee/hero-interfaces/IWaitForOptions';
import {
  IElementIsolate,
  IHTMLFrameElementIsolate,
  IHTMLIFrameElementIsolate,
  IHTMLObjectElementIsolate,
  INodeIsolate,
} from 'awaited-dom/base/interfaces/isolate';
import CSSStyleDeclaration from 'awaited-dom/impl/official-klasses/CSSStyleDeclaration';
import IHeroMeta from '@ulixee/hero-interfaces/IHeroMeta';
import IScreenshotOptions from '@unblocked-web/specifications/agent/browser/IScreenshotOptions';
import { INodeVisibility } from '@unblocked-web/js-path';
import IClientPlugin, { IClientPluginClass } from '@ulixee/hero-interfaces/IClientPlugin';
import { PluginTypes } from '@ulixee/hero-interfaces/IPluginTypes';
import requirePlugins from '@ulixee/hero-plugin-utils/lib/utils/requirePlugins';
import filterPlugins from '@ulixee/hero-plugin-utils/lib/utils/filterPlugins';
import extractPlugins from '@ulixee/hero-plugin-utils/lib/utils/extractPlugins';
import IFlowCommandOptions from '@ulixee/hero-interfaces/IFlowCommandOptions';
import DisconnectedError from '@ulixee/net/errors/DisconnectedError';
import { IPluginClass } from '@ulixee/hero-interfaces/IPlugin';
import {
  IElementInteractVerification,
  IMousePositionXY,
  isMousePositionXY,
} from '@unblocked-web/specifications/agent/interact/IInteractions';
import IDomState, { IDomStateAllFn } from '@ulixee/hero-interfaces/IDomState';
import IResourceFilterProperties from '@ulixee/hero-interfaces/IResourceFilterProperties';
import WebsocketResource from './WebsocketResource';
import IWaitForResourceFilter from '../interfaces/IWaitForResourceFilter';
import Resource from './Resource';
import Interactor from './Interactor';
import IInteractions, {
  Command,
  IInteraction,
  ITypeInteraction,
} from '../interfaces/IInteractions';
import Tab, { createTab, getCoreTab } from './Tab';
import IHeroCreateOptions from '../interfaces/IHeroCreateOptions';
import AwaitedEventTarget from './AwaitedEventTarget';
import IHeroDefaults from '../interfaces/IHeroDefaults';
import ConnectionFactory from '../connections/ConnectionFactory';
import FrameEnvironment, { getCoreFrameEnvironmentForPosition } from './FrameEnvironment';
import FileChooser from './FileChooser';
import CoreFrameEnvironment from './CoreFrameEnvironment';
import DomState from './DomState';
import ConnectionToHeroCore from '../connections/ConnectionToHeroCore';
import CoreSession from './CoreSession';
import { InternalPropertiesSymbol, scriptInstance } from './internal';
import './DomExtender';
import IWaitForResourcesFilter from '../interfaces/IWaitForResourcesFilter';

export const DefaultOptions = {
  defaultBlockedResourceTypes: [BlockedResourceType.None],
  defaultUserProfile: {},
};

export type ISessionOptions = Omit<ISessionCreateOptions, 'sessionId'> &
  Pick<IHeroCreateOptions, 'connectionToCore' | 'sessionId'>;

const propertyKeys: (keyof Hero)[] = [
  'document',
  'sessionId',
  'meta',
  'tabs',
  'frameEnvironments',
  'isAllContentLoaded',
  'isDomContentLoaded',
  'isPaintingStable',
  'mainFrameEnvironment',
  'coreHost',
  'activeTab',
  'sessionName',
  'url',
  'lastCommandId',
  'Request',
];

interface ISharedInternalProperties {
  clientPlugins: IClientPlugin[];
  coreSessionPromise: Promise<CoreSession>;
}

export default class Hero extends AwaitedEventTarget<{
  close: () => void;
  command: (name: string, commandId: number, args: any[]) => void;
}> {
  protected static options: IHeroDefaults = { ...DefaultOptions };

  readonly #options: ISessionOptions;
  readonly #clientPlugins: IClientPlugin[] = [];
  readonly #connectionToCore: ConnectionToHeroCore;
  readonly #didAutoCreateConnection: boolean = false;
  #coreSessionPromise: Promise<CoreSession | Error>;
  #tabs: Tab[];
  #activeTab: Tab;
  #isClosingPromise: Promise<void>;

  get [InternalPropertiesSymbol](): ISharedInternalProperties {
    const coreSessionPromise = (): Promise<CoreSession> => this.#getCoreSessionOrReject();
    return {
      clientPlugins: this.#clientPlugins,
      get coreSessionPromise() {
        return coreSessionPromise();
      },
    };
  }

  constructor(createOptions: IHeroCreateOptions = {}) {
    super(() => {
      return {
        target: this.#getCoreSessionOrReject(),
      };
    });

    bindFunctions(this);

    const { name, connectionToCore, ...options } = createOptions;
    options.blockedResourceTypes ??= Hero.options.defaultBlockedResourceTypes;
    options.userProfile ??= Hero.options.defaultUserProfile;

    const sessionName = scriptInstance.generateSessionName(name);

    this.#options = {
      ...options,
      mode: options.mode ?? scriptInstance.mode,
      sessionName,
      scriptInstanceMeta: scriptInstance.meta,
      dependencyMap: {},
      corePluginPaths: [],
    } as ISessionOptions;

    this.#connectionToCore = ConnectionFactory.createConnection(
      connectionToCore ?? { isPersistent: false },
    );

    this.#didAutoCreateConnection = this.#connectionToCore !== connectionToCore;
  }

  public get activeTab(): Tab {
    this.#getCoreSessionOrReject().catch(() => null);
    return this.#activeTab;
  }

  public get document(): SuperDocument {
    return this.activeTab.document;
  }

  public get frameEnvironments(): Promise<FrameEnvironment[]> {
    return this.activeTab.frameEnvironments;
  }

  public get isAllContentLoaded(): Promise<boolean> {
    return this.activeTab.isAllContentLoaded;
  }

  public get isDomContentLoaded(): Promise<boolean> {
    return this.activeTab.isDomContentLoaded;
  }

  public get isPaintingStable(): Promise<boolean> {
    return this.activeTab.isPaintingStable;
  }

  public get lastCommandId(): Promise<number> {
    return this.activeTab.lastCommandId;
  }

  public get mainFrameEnvironment(): FrameEnvironment {
    return this.activeTab.mainFrameEnvironment;
  }

  public get sessionId(): Promise<string> {
    const coreSession = this.#getCoreSessionOrReject();
    return coreSession.then(x => x.sessionId);
  }

  public get sessionName(): Promise<string> {
    return Promise.resolve(this.#options.sessionName);
  }

  public get meta(): Promise<IHeroMeta> {
    const coreSession = this.#getCoreSessionOrReject();
    return coreSession.then(x => x.getHeroMeta());
  }

  public get storage(): Promise<IDomStorage> {
    const coreTab = getCoreTab(this.activeTab);
    return coreTab.then(async tab => {
      const profile = await tab.exportUserProfile();
      return profile.storage;
    });
  }

  public get tabs(): Promise<Tab[]> {
    return this.#refreshedTabs();
  }

  public get url(): Promise<string> {
    return this.activeTab.url;
  }

  public get coreHost(): Promise<string> {
    return Promise.resolve(this.#connectionToCore?.transport.host);
  }

  public get Request(): typeof Request {
    return this.activeTab.Request;
  }

  // METHODS

  public close(): Promise<void> {
    return (this.#isClosingPromise ??= new Promise(async (resolve, reject) => {
      try {
        const sessionOrError = await this.#coreSessionPromise;
        if (sessionOrError instanceof CoreSession) {
          await sessionOrError.close();
        }
        if (this.#didAutoCreateConnection) {
          await this.#connectionToCore.disconnect();
        }
      } catch (error) {
        if (!(error instanceof DisconnectedError)) return reject(error);
      }
      resolve();
    }));
  }

  public async closeTab(tab: Tab): Promise<void> {
    const tabIdx = this.#tabs.indexOf(tab);
    this.#tabs.splice(tabIdx, 1);
    if (this.#tabs.length) {
      this.#activeTab = this.#tabs[0];
    }
    const coreTab = await getCoreTab(tab);
    await coreTab.close();
  }

  public async findResource(
    filter: IResourceFilterProperties,
    options?: { sinceCommandId: number },
  ): Promise<Resource> {
    return await this.activeTab.findResource(filter, options);
  }

  public async findResources(
    filter: IResourceFilterProperties,
    options?: { sinceCommandId: number },
  ): Promise<Resource[]> {
    return await this.activeTab.findResources(filter, options);
  }

  public async focusTab(tab: Tab): Promise<void> {
    const coreTab = await getCoreTab(tab);
    await coreTab.focusTab();
    this.#activeTab = tab;
  }

  public async waitForNewTab(options?: IWaitForOptions): Promise<Tab> {
    const coreTab = await getCoreTab(this.activeTab);
    const newCoreTab = coreTab.waitForNewTab(options);
    const tab = createTab(this, newCoreTab);
    this.#tabs.push(tab);
    return tab;
  }

  // INTERACT METHODS

  public async click(
    mousePosition: IMousePositionXY | ISuperElement,
    options?: {
      clickVerification?: IElementInteractVerification;
    },
  ): Promise<void> {
    let coreFrame = await getCoreFrameEnvironmentForPosition(mousePosition);
    coreFrame ??= await this.activeTab.mainFrameEnvironment[InternalPropertiesSymbol]
      .coreFramePromise;
    let interaction: IInteraction = { click: mousePosition };
    if (!isMousePositionXY(mousePosition)) {
      interaction = {
        click: {
          element: mousePosition as ISuperElement,
          verification: options?.clickVerification ?? 'elementAtPath',
        },
      };
    }
    await Interactor.run(coreFrame, [interaction]);
  }

  public async getFrameEnvironment(
    frameElement: IHTMLFrameElementIsolate | IHTMLIFrameElementIsolate | IHTMLObjectElementIsolate,
  ): Promise<FrameEnvironment | null> {
    return await this.activeTab.getFrameEnvironment(frameElement);
  }

  public async interact(...interactions: IInteractions): Promise<void> {
    if (!interactions.length) return;
    let coreFrame = await getCoreFrameForInteractions(interactions);
    coreFrame ??= await this.activeTab.mainFrameEnvironment[InternalPropertiesSymbol]
      .coreFramePromise;
    await Interactor.run(coreFrame, interactions);
  }

  public async scrollTo(mousePosition: IMousePositionXY | ISuperElement): Promise<void> {
    let coreFrame = await getCoreFrameEnvironmentForPosition(mousePosition);
    coreFrame ??= await this.activeTab.mainFrameEnvironment[InternalPropertiesSymbol]
      .coreFramePromise;
    await Interactor.run(coreFrame, [{ [Command.scroll]: mousePosition }]);
  }

  public async type(...typeInteractions: ITypeInteraction[]): Promise<void> {
    const coreFrame = await this.activeTab.mainFrameEnvironment[InternalPropertiesSymbol]
      .coreFramePromise;
    await Interactor.run(
      coreFrame,
      typeInteractions.map(t => ({ type: t })),
    );
  }

  public async exportUserProfile(): Promise<IUserProfile> {
    const coreTab = await getCoreTab(this.activeTab);
    return await coreTab.exportUserProfile();
  }

  // PLUGINS

  public use(PluginObject: string | IClientPluginClass | { [name: string]: IPluginClass }): void {
    const ClientPluginsById: { [id: string]: IClientPluginClass } = {};

    if (this.#coreSessionPromise) {
      throw new Error(
        'You must call .use before any Hero "await" calls (ie, before the Agent connects to Core).',
      );
    }

    if (typeof PluginObject === 'string') {
      const Plugins = requirePlugins(PluginObject as string);
      const CorePlugins = filterPlugins(Plugins, PluginTypes.CorePlugin);
      const ClientPlugins = filterPlugins<IClientPluginClass>(Plugins, PluginTypes.ClientPlugin);
      if (CorePlugins.length) {
        this.#options.corePluginPaths.push(PluginObject);
      }
      ClientPlugins.forEach(ClientPlugin => (ClientPluginsById[ClientPlugin.id] = ClientPlugin));
    } else {
      const ClientPlugins = extractPlugins<IClientPluginClass>(
        PluginObject as any,
        PluginTypes.ClientPlugin,
      );
      ClientPlugins.forEach(ClientPlugin => (ClientPluginsById[ClientPlugin.id] = ClientPlugin));
    }

    const clientPlugins: IClientPlugin[] = [];
    for (const ClientPlugin of Object.values(ClientPluginsById)) {
      const clientPlugin = new ClientPlugin();
      this.#clientPlugins.push(clientPlugin);
      clientPlugins.push(clientPlugin);
      this.#options.dependencyMap[ClientPlugin.id] = ClientPlugin.coreDependencyIds || [];
    }
    if (this.#coreSessionPromise) {
      this.#initializeClientPlugins(clientPlugins);
    }
  }

  /////// METHODS THAT DELEGATE TO ACTIVE TAB //////////////////////////////////////////////////////////////////////////

  public goto(href: string, options?: { timeoutMs?: number }): Promise<Resource> {
    return this.activeTab.goto(href, options);
  }

  public goBack(options?: { timeoutMs?: number }): Promise<string> {
    return this.activeTab.goBack(options);
  }

  public goForward(options?: { timeoutMs?: number }): Promise<string> {
    return this.activeTab.goForward(options);
  }

  public reload(options?: { timeoutMs?: number }): Promise<Resource> {
    return this.activeTab.reload(options);
  }

  public fetch(request: Request | string, init?: IRequestInit): Promise<Response> {
    return this.activeTab.fetch(request, init);
  }

  public getComputedStyle(element: IElementIsolate, pseudoElement?: string): CSSStyleDeclaration {
    return this.activeTab.getComputedStyle(element, pseudoElement);
  }

  public getComputedVisibility(node: INodeIsolate): Promise<INodeVisibility> {
    return this.activeTab.getComputedVisibility(node);
  }

  public getJsValue<T>(path: string): Promise<T> {
    return this.activeTab.getJsValue<T>(path);
  }

  // @deprecated 2021-04-30: Replaced with getComputedVisibility
  public async isElementVisible(element: IElementIsolate): Promise<boolean> {
    return await this.getComputedVisibility(element as any).then(x => x.isVisible);
  }

  public async pause(): Promise<void> {
    const session = await this.#getCoreSessionOrReject();
    await session.pause();
  }

  public querySelector(selector: string): ISuperNode {
    return this.activeTab.querySelector(selector);
  }

  public querySelectorAll(selector: string): ISuperNodeList {
    return this.activeTab.querySelectorAll(selector);
  }

  public xpathSelector(xpath: string, orderedNodeResults = false): ISuperNode {
    return this.activeTab.xpathSelector(xpath, orderedNodeResults);
  }

  public xpathSelectorAll(xpath: string, orderedNodeResults = false): Promise<ISuperNode[]> {
    return this.activeTab.xpathSelectorAll(xpath, orderedNodeResults);
  }

  public takeScreenshot(options?: IScreenshotOptions): Promise<Buffer> {
    return this.activeTab.takeScreenshot(options);
  }

  public waitForPaintingStable(options?: IWaitForOptions): Promise<void> {
    return this.activeTab.waitForPaintingStable(options);
  }

  public waitForResource(
    filter: IWaitForResourceFilter,
    options?: IWaitForResourceOptions,
  ): Promise<Resource | WebsocketResource> {
    return this.activeTab.waitForResource(filter, options);
  }

  public waitForResources(
    filter: IWaitForResourcesFilter,
    options?: IWaitForResourceOptions,
  ): Promise<(Resource | WebsocketResource)[]> {
    return this.activeTab.waitForResources(filter, options);
  }

  public waitForElement(
    element: ISuperElement,
    options?: IWaitForElementOptions,
  ): Promise<ISuperElement | null> {
    return this.activeTab.waitForElement(element, options);
  }

  public waitForFileChooser(options?: IWaitForOptions): Promise<FileChooser> {
    return this.activeTab.waitForFileChooser(options);
  }

  public waitForLocation(trigger: ILocationTrigger, options?: IWaitForOptions): Promise<Resource> {
    return this.activeTab.waitForLocation(trigger, options);
  }

  public waitForLoad(status: ILoadStatus, options?: IWaitForOptions): Promise<void> {
    return this.activeTab.waitForLoad(status, options);
  }

  public waitForMillis(millis: number): Promise<void> {
    return this.activeTab.waitForMillis(millis);
  }

  public async waitForState(
    state: IDomState | DomState | IDomStateAllFn,
    options?: Pick<IWaitForOptions, 'timeoutMs'>,
  ): Promise<void> {
    return await this.activeTab.waitForState(state, options);
  }

  public async validateState(state: IDomState | DomState | IDomStateAllFn): Promise<boolean> {
    return await this.activeTab.validateState(state);
  }

  public async flowCommand(
    commandFn: () => Promise<void>,
    optionsOrExitState?: IDomStateAllFn | IFlowCommandOptions,
  ): Promise<void> {
    return await this.activeTab.flowCommand(commandFn, optionsOrExitState);
  }

  public async registerFlowHandler(
    name: string,
    state: IDomState | DomState | IDomStateAllFn,
    handlerCallbackFn: (error?: Error) => Promise<any>,
  ): Promise<void> {
    return await this.activeTab.registerFlowHandler(name, state, handlerCallbackFn);
  }

  public async triggerFlowHandlers(): Promise<void> {
    return await this.activeTab.triggerFlowHandlers();
  }

  /////// THENABLE ///////////////////////////////////////////////////////////////////////////////////////////////////

  public async then<TResult1 = Hero, TResult2 = never>(
    onfulfilled?:
      | ((value: Omit<Hero, 'then'>) => PromiseLike<TResult1> | TResult1)
      | undefined
      | null,
    onrejected?: ((reason: any) => PromiseLike<TResult2> | TResult2) | undefined | null,
  ): Promise<TResult1 | TResult2> {
    try {
      this.then = null;
      await this.#getCoreSessionOrReject();
      return onfulfilled(this);
    } catch (err) {
      if (onrejected) return onrejected(err);
      throw err;
    }
  }

  public toJSON(): any {
    // return empty so we can avoid infinite "stringifying" in jest
    return {
      type: this.constructor.name,
    };
  }

  public [Util.inspect.custom](): any {
    return inspectInstanceProperties(this, propertyKeys as any);
  }

  #getCoreSessionOrReject(): Promise<CoreSession> {
    if (!this.#coreSessionPromise) {
      this.#coreSessionPromise = this.#connectionToCore
        .createSession(this.#options)
        .then(session => {
          if (session instanceof CoreSession) this.#initializeClientPlugins(this.#clientPlugins);
          return session;
        })
        .catch(err => err);

      const coreTab = this.#coreSessionPromise
        .then(x => {
          if (x instanceof Error) throw x;
          return x.firstTab;
        })
        .catch(err => err);

      this.#activeTab = createTab(this, coreTab);
      this.#tabs = [this.#activeTab];
    }

    return this.#coreSessionPromise.then(coreSession => {
      if (coreSession instanceof CoreSession) return coreSession;
      if (coreSession === null) return null;
      throw coreSession;
    });
  }

  #initializeClientPlugins(plugins: IClientPlugin[]): void {
    for (const clientPlugin of plugins) {
      if (clientPlugin.onHero) clientPlugin.onHero(this, this.#sendToActiveTab.bind(this));
    }
  }

  async #sendToActiveTab(toPluginId: string, ...args: any[]): Promise<any> {
    const coreSession = (await this.#coreSessionPromise) as CoreSession;
    const coreTab = coreSession.tabsById.get(await this.#activeTab.tabId);
    return coreTab.commandQueue.run('Tab.runPluginCommand', toPluginId, args);
  }

  async #refreshedTabs(): Promise<Tab[]> {
    const session = await this.#getCoreSessionOrReject();
    const coreTabs = await session.getTabs();
    const tabIds = await Promise.all(this.#tabs.map(x => x.tabId));
    for (const coreTab of coreTabs) {
      const hasTab = tabIds.includes(coreTab.tabId);
      if (!hasTab) {
        const tab = createTab(this, Promise.resolve(coreTab));
        this.#tabs.push(tab);
      }
    }
    return this.#tabs;
  }
}

async function getCoreFrameForInteractions(
  interactions: IInteractions,
): Promise<CoreFrameEnvironment> {
  for (const interaction of interactions) {
    if (typeof interaction !== 'object') continue;
    for (const element of Object.values(interaction)) {
      const coreFrame = await getCoreFrameEnvironmentForPosition(element);
      if (coreFrame) return coreFrame;
    }
  }
}
