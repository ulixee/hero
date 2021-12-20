import * as Util from 'util';
import { EventEmitter } from 'events';
import { BlockedResourceType } from '@ulixee/hero-interfaces/ITabOptions';
import StateMachine from 'awaited-dom/base/StateMachine';
import inspectInstanceProperties from 'awaited-dom/base/inspectInstanceProperties';
import { bindFunctions, createPromise, getCallSite } from '@ulixee/commons/lib/utils';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import SuperDocument from 'awaited-dom/impl/super-klasses/SuperDocument';
import IDomStorage from '@ulixee/hero-interfaces/IDomStorage';
import IUserProfile from '@ulixee/hero-interfaces/IUserProfile';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import Response from 'awaited-dom/impl/official-klasses/Response';
import { ISuperElement, ISuperNode, ISuperNodeList } from 'awaited-dom/base/interfaces/super';
import IWaitForResourceOptions from '@ulixee/hero-interfaces/IWaitForResourceOptions';
import IWaitForElementOptions from '@ulixee/hero-interfaces/IWaitForElementOptions';
import { ILocationTrigger } from '@ulixee/hero-interfaces/Location';
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
import IScreenshotOptions from '@ulixee/hero-interfaces/IScreenshotOptions';
import { INodeVisibility } from '@ulixee/hero-interfaces/INodeVisibility';
import IClientPlugin, { IClientPluginClass } from '@ulixee/hero-interfaces/IClientPlugin';
import { PluginTypes } from '@ulixee/hero-interfaces/IPluginTypes';
import requirePlugins from '@ulixee/hero-plugin-utils/lib/utils/requirePlugins';
import filterPlugins from '@ulixee/hero-plugin-utils/lib/utils/filterPlugins';
import extractPlugins from '@ulixee/hero-plugin-utils/lib/utils/extractPlugins';
import { IPluginClass } from '@ulixee/hero-interfaces/IPlugin';
import WebsocketResource from './WebsocketResource';
import IWaitForResourceFilter from '../interfaces/IWaitForResourceFilter';
import Resource from './Resource';
import Interactor from './Interactor';
import IInteractions, {
  Command,
  IMousePosition,
  ITypeInteraction,
} from '../interfaces/IInteractions';
import Tab, { createTab, getCoreTab } from './Tab';
import IHeroCreateOptions from '../interfaces/IHeroCreateOptions';
import ScriptInstance from './ScriptInstance';
import AwaitedEventTarget from './AwaitedEventTarget';
import IHeroDefaults from '../interfaces/IHeroDefaults';
import { ICreateConnectionToCoreFn } from '../connections/ConnectionFactory';
import DisconnectedFromCoreError from '../connections/DisconnectedFromCoreError';
import FrameEnvironment, {
  getCoreFrameEnvironment,
  getCoreFrameEnvironmentForPosition,
} from './FrameEnvironment';
import FrozenTab from './FrozenTab';
import FileChooser from './FileChooser';
import CoreFrameEnvironment from './CoreFrameEnvironment';
import ConnectionManager from './ConnectionManager';
import './DomExtender';
import IPageStateDefinitions from '../interfaces/IPageStateDefinitions';
import IMagicSelectorOptions from '@ulixee/hero-interfaces/IMagicSelectorOptions';

export const DefaultOptions = {
  defaultBlockedResourceTypes: [BlockedResourceType.None],
  defaultUserProfile: {},
};
export const scriptInstance = new ScriptInstance();

const { getState, setState } = StateMachine<Hero, IState>();

export type IStateOptions = Omit<ISessionCreateOptions, 'externalIds' | 'sessionId'> &
  Pick<IHeroCreateOptions, 'connectionToCore' | 'externalIds' | 'sessionId'>;

export interface IState {
  connection: ConnectionManager;
  isClosing: boolean;
  options: IStateOptions;
  clientPlugins: IClientPlugin[];
}

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

type IClassEvents = {
  new: (heroInstance: Hero, heroCreateOptions: IHeroCreateOptions) => void;
};

export default class Hero extends AwaitedEventTarget<{
  close: () => void;
  command: (name: string, commandId: number, args: any[]) => void;
}> {
  public static createConnectionToCore: ICreateConnectionToCoreFn;
  protected static options: IHeroDefaults = { ...DefaultOptions };
  private static emitter = new EventEmitter();

  constructor(options: IHeroCreateOptions = {}) {
    const connectionManagerIsReady = createPromise();
    super(async () => {
      await connectionManagerIsReady.promise;
      return {
        target: getState(this).connection.getConnectedCoreSessionOrReject(),
      };
    });

    bindFunctions(this);
    (this.constructor as typeof Hero).emitter.emit('new', this, options);

    options.blockedResourceTypes =
      options.blockedResourceTypes || Hero.options.defaultBlockedResourceTypes;
    options.userProfile = options.userProfile || Hero.options.defaultUserProfile;

    const sessionName = scriptInstance.generateSessionName(options.name);
    delete options.name;

    options = {
      ...options,
      mode: options.mode ?? scriptInstance.mode,
      sessionName,
      scriptInstanceMeta: scriptInstance.meta,
      dependencyMap: {},
      corePluginPaths: [],
    } as IStateOptions;

    const connection = new ConnectionManager(this, options);

    setState(this, {
      connection,
      isClosing: false,
      options,
      clientPlugins: [],
    });

    connectionManagerIsReady.resolve();
  }

  public get activeTab(): Tab {
    return getState(this).connection.activeTab;
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
    const coreSession = getState(this).connection.getConnectedCoreSessionOrReject();
    return coreSession.then(x => x.sessionId);
  }

  public get sessionName(): Promise<string> {
    return Promise.resolve(getState(this).options.sessionName);
  }

  public get meta(): Promise<IHeroMeta> {
    const coreSession = getState(this).connection.getConnectedCoreSessionOrReject();
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
    return getState(this).connection.refreshedTabs();
  }

  public get url(): Promise<string> {
    return this.activeTab.url;
  }

  public get coreHost(): Promise<string> {
    return getState(this).connection.host;
  }

  public get Request(): typeof Request {
    return this.activeTab.Request;
  }

  // METHODS

  public async close(): Promise<void> {
    const { isClosing, connection } = getState(this);
    if (isClosing) return;
    setState(this, { isClosing: true });

    try {
      return await connection.close();
    } catch (error) {
      if (error instanceof DisconnectedFromCoreError) return;
      throw error;
    }
  }

  public async closeTab(tab: Tab): Promise<void> {
    await tab.close();
  }

  public detach(tab: Tab, key?: string): FrozenTab {
    const callSitePath = JSON.stringify(getCallSite(module.filename, scriptInstance.entrypoint));

    const coreTab = getCoreTab(tab);
    const coreSession = getState(this).connection.getConnectedCoreSessionOrReject();

    const detachedTab = coreSession.then(async session =>
      session.detachTab(await coreTab, callSitePath, key),
    );

    return new FrozenTab(this, detachedTab);
  }

  public async focusTab(tab: Tab): Promise<void> {
    await tab.focus();
  }

  public async waitForNewTab(options?: IWaitForOptions): Promise<Tab> {
    const coreTab = await getCoreTab(this.activeTab);
    const newCoreTab = coreTab.waitForNewTab(options);
    const tab = createTab(this, newCoreTab);
    getState(this).connection.addTab(tab);
    return tab;
  }

  // INTERACT METHODS

  public async click(mousePosition: IMousePosition): Promise<void> {
    let coreFrame = await getCoreFrameEnvironmentForPosition(mousePosition);
    coreFrame ??= await getCoreFrameEnvironment(this.activeTab.mainFrameEnvironment);
    await Interactor.run(coreFrame, [{ click: mousePosition }]);
  }

  public async getFrameEnvironment(
    frameElement: IHTMLFrameElementIsolate | IHTMLIFrameElementIsolate | IHTMLObjectElementIsolate,
  ): Promise<FrameEnvironment | null> {
    return await this.activeTab.getFrameEnvironment(frameElement);
  }

  public async interact(...interactions: IInteractions): Promise<void> {
    if (!interactions.length) return;
    let coreFrame = await getCoreFrameForInteractions(interactions);
    coreFrame ??= await getCoreFrameEnvironment(this.activeTab.mainFrameEnvironment);
    await Interactor.run(coreFrame, interactions);
  }

  public async scrollTo(mousePosition: IMousePosition): Promise<void> {
    let coreFrame = await getCoreFrameEnvironmentForPosition(mousePosition);
    coreFrame ??= await getCoreFrameEnvironment(this.activeTab.mainFrameEnvironment);
    await Interactor.run(coreFrame, [{ [Command.scroll]: mousePosition }]);
  }

  public async type(...typeInteractions: ITypeInteraction[]): Promise<void> {
    const coreFrame = await getCoreFrameEnvironment(this.activeTab.mainFrameEnvironment);
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
    const { clientPlugins, options, connection } = getState(this);
    const ClientPluginsById: { [id: string]: IClientPluginClass } = {};

    if (connection.hasConnected) {
      throw new Error(
        'You must call .use before any Hero "await" calls (ie, before the Agent connects to Core).',
      );
    }

    if (typeof PluginObject === 'string') {
      const Plugins = requirePlugins(PluginObject as string);
      const CorePlugins = filterPlugins(Plugins, PluginTypes.CorePlugin);
      const ClientPlugins = filterPlugins<IClientPluginClass>(Plugins, PluginTypes.ClientPlugin);
      if (CorePlugins.length) {
        options.corePluginPaths.push(PluginObject);
      }
      ClientPlugins.forEach(ClientPlugin => (ClientPluginsById[ClientPlugin.id] = ClientPlugin));
    } else {
      const ClientPlugins = extractPlugins<IClientPluginClass>(
        PluginObject as any,
        PluginTypes.ClientPlugin,
      );
      ClientPlugins.forEach(ClientPlugin => (ClientPluginsById[ClientPlugin.id] = ClientPlugin));
    }

    Object.values(ClientPluginsById).forEach(ClientPlugin => {
      const clientPlugin = new ClientPlugin();
      clientPlugins.push(clientPlugin);
      if (connection.hasConnected && clientPlugin.onHero) {
        clientPlugin.onHero(this, connection.sendToActiveTab);
      }

      options.dependencyMap[ClientPlugin.id] = ClientPlugin.coreDependencyIds || [];
    });
  }

  /////// METHODS THAT DELEGATE TO ACTIVE TAB //////////////////////////////////////////////////////////////////////////

  public goto(href: string, timeoutMs?: number): Promise<Resource> {
    return this.activeTab.goto(href, timeoutMs);
  }

  public goBack(timeoutMs?: number): Promise<string> {
    return this.activeTab.goBack(timeoutMs);
  }

  public goForward(timeoutMs?: number): Promise<string> {
    return this.activeTab.goForward(timeoutMs);
  }

  public reload(timeoutMs?: number): Promise<Resource> {
    return this.activeTab.reload(timeoutMs);
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

  public magicSelector(selectorOrOptions?: string | IMagicSelectorOptions): ISuperNode {
    return this.activeTab.magicSelector(selectorOrOptions);
  }

  public magicSelectorAll(selectorOrOptions?: string | IMagicSelectorOptions): ISuperNodeList {
    return this.activeTab.magicSelectorAll(selectorOrOptions);
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
  ): Promise<(Resource | WebsocketResource)[]> {
    return this.activeTab.waitForResource(filter, options);
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

  public waitForMillis(millis: number): Promise<void> {
    return this.activeTab.waitForMillis(millis);
  }

  public async waitForPageState<T extends IPageStateDefinitions>(
    states?: T,
    options?: Pick<IWaitForOptions, 'timeoutMs'>,
  ): Promise<keyof T> {
    return await this.activeTab.waitForPageState(states, options);
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
      await getState(this).connection.getConnectedCoreSessionOrReject();
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

  // CLASS EVENT EMITTER ///////////////////////////////////////////////////////////////////////////////////////////////

  public static addListener<K extends keyof IClassEvents>(
    eventType: K,
    listenerFn: IClassEvents[K],
  ): void {
    this.emitter.addListener(eventType, listenerFn);
  }

  public static removeListener<K extends keyof IClassEvents>(
    eventType: K,
    listenerFn: IClassEvents[K],
  ): void {
    this.emitter.removeListener(eventType, listenerFn);
  }

  public static once<K extends keyof IClassEvents>(
    eventType: K,
    listenerFn: IClassEvents[K],
  ): void {
    this.emitter.once(eventType, listenerFn);
  }

  // aliases

  public static on<K extends keyof IClassEvents>(eventType: K, listenerFn: IClassEvents[K]): void {
    this.addListener(eventType, listenerFn);
  }

  public static off<K extends keyof IClassEvents>(eventType: K, listenerFn: IClassEvents[K]): void {
    this.removeListener(eventType, listenerFn);
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
