import * as Util from 'util';
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
import {
  IElementInteractVerification,
  IMousePositionXY,
  isMousePositionXY,
} from '@ulixee/hero-interfaces/IInteractions';
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
import ICollectedResource from '@ulixee/hero-interfaces/ICollectedResource';
import ICollectedFragment from '@ulixee/hero-interfaces/ICollectedFragment';
import IDomState from '@ulixee/hero-interfaces/IDomState';
import DomState from './DomState';

export const DefaultOptions = {
  defaultBlockedResourceTypes: [BlockedResourceType.None],
  defaultUserProfile: {},
};
export const scriptInstance = new ScriptInstance();

const { getState, setState } = StateMachine<Hero, IState>();

export type IStateOptions = Omit<ISessionCreateOptions, 'sessionId'> &
  Pick<IHeroCreateOptions, 'connectionToCore' | 'sessionId'>;

export interface IState {
  connection: ConnectionManager;
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

export default class Hero extends AwaitedEventTarget<{
  close: () => void;
  command: (name: string, commandId: number, args: any[]) => void;
}> {
  public static createConnectionToCore: ICreateConnectionToCoreFn;
  protected static options: IHeroDefaults = { ...DefaultOptions };

  readonly #connectManagerIsReady = createPromise();
  readonly #options: IStateOptions;
  #isClosingPromise: Promise<void>;

  constructor(options: IHeroCreateOptions = {}) {
    super(async () => {
      await this.#connectManagerIsReady.promise;
      return {
        target: getState(this).connection.getConnectedCoreSessionOrReject(),
      };
    });

    bindFunctions(this);

    options.blockedResourceTypes =
      options.blockedResourceTypes || Hero.options.defaultBlockedResourceTypes;
    options.userProfile = options.userProfile || Hero.options.defaultUserProfile;

    const sessionName = scriptInstance.generateSessionName(options.name);
    delete options.name;

    this.#options = {
      ...options,
      mode: options.mode ?? scriptInstance.mode,
      sessionName,
      scriptInstanceMeta: scriptInstance.meta,
      dependencyMap: {},
      corePluginPaths: [],
    } as IStateOptions;

    const connection = new ConnectionManager(this, this.#options);

    setState(this, {
      connection,
      clientPlugins: [],
    });

    this.#connectManagerIsReady.resolve();
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
    return Promise.resolve(this.#options.sessionName);
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

  public async recordOutput(changesToRecord): Promise<void> {
    const coreSession = await getState(this).connection.getConnectedCoreSessionOrReject();
    coreSession.recordOutput(changesToRecord);
  }

  public close(): Promise<void> {
    const { connection } = getState(this);
    return this.#isClosingPromise ??= new Promise((resolve, reject) => {
      connection.close().then(() => resolve()).catch(error => {
        if (error instanceof DisconnectedFromCoreError) return resolve();
        reject(error);
      });
    });
  }

  public async closeTab(tab: Tab): Promise<void> {
    await tab.close();
  }

  public async getCollectedResources(
    sessionIdPromise: Promise<string>,
    name: string,
  ): Promise<ICollectedResource[]> {
    const sessionId = await sessionIdPromise;
    const coreSession = await getState(this).connection.getConnectedCoreSessionOrReject();
    const resources = await coreSession.getCollectedResources(sessionId, name);

    const results: ICollectedResource[] = [];
    for (const resource of resources) {
      const buffer = resource.response?.body;
      delete resource.response?.body;

      const properties: PropertyDescriptorMap = {
        buffer: { get: () => buffer, enumerable: true },
        json: { get: () => (buffer ? JSON.parse(buffer.toString()) : null), enumerable: true },
        text: { get: () => buffer?.toString(), enumerable: true },
      };

      if (resource.response) {
        Object.defineProperties(resource.response, properties);
      }
      Object.defineProperties(resource, properties);
      results.push(resource as ICollectedResource);
    }
    return results;
  }

  public async getCollectedFragments(
    sessionIdPromise: Promise<string>,
    name: string,
  ): Promise<ICollectedFragment[]> {
    const sessionId = await sessionIdPromise;
    const coreSession = await getState(this).connection.getConnectedCoreSessionOrReject();
    return await coreSession.getCollectedFragments(sessionId, name);
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

  public async click(
    mousePosition: IMousePositionXY | ISuperElement,
    options?: {
      clickVerification?: IElementInteractVerification;
    },
  ): Promise<void> {
    let coreFrame = await getCoreFrameEnvironmentForPosition(mousePosition);
    coreFrame ??= await getCoreFrameEnvironment(this.activeTab.mainFrameEnvironment);
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
    coreFrame ??= await getCoreFrameEnvironment(this.activeTab.mainFrameEnvironment);
    await Interactor.run(coreFrame, interactions);
  }

  public async scrollTo(mousePosition: IMousePositionXY | ISuperElement): Promise<void> {
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
    const { clientPlugins, connection } = getState(this);
    const ClientPluginsById: { [id: string]: IClientPluginClass } = {};

    if (connection.hasConnectedCoreSession) {
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

    Object.values(ClientPluginsById).forEach(ClientPlugin => {
      const clientPlugin = new ClientPlugin();
      clientPlugins.push(clientPlugin);
      if (connection.hasConnectedCoreSession && clientPlugin.onHero) {
        clientPlugin.onHero(this, connection.sendToActiveTab);
      }

      this.#options.dependencyMap[ClientPlugin.id] = ClientPlugin.coreDependencyIds || [];
    });
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

  public querySelector(selector: string): ISuperNode {
    return this.activeTab.querySelector(selector);
  }

  public querySelectorAll(selector: string): ISuperNodeList {
    return this.activeTab.querySelectorAll(selector);
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

  public async waitForState(
    state: IDomState | DomState,
    options?: Pick<IWaitForOptions, 'timeoutMs'>,
  ): Promise<boolean> {
    return await this.activeTab.waitForState(state, options);
  }

  public async ensureState(state: IDomState | DomState): Promise<boolean> {
    return await this.activeTab.ensureState(state);
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
