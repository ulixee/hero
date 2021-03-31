// eslint-disable-next-line max-classes-per-file
import { BlockedResourceType } from '@secret-agent/core-interfaces/ITabOptions';
import StateMachine from 'awaited-dom/base/StateMachine';
import initializeConstantsAndProperties from 'awaited-dom/base/initializeConstantsAndProperties';
import { bindFunctions } from '@secret-agent/commons/utils';
import ICreateSessionOptions from '@secret-agent/core-interfaces/ICreateSessionOptions';
import SuperDocument from 'awaited-dom/impl/super-klasses/SuperDocument';
import IDomStorage from '@secret-agent/core-interfaces/IDomStorage';
import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import Response from 'awaited-dom/impl/official-klasses/Response';
import { ISuperElement } from 'awaited-dom/base/interfaces/super';
import IWaitForResourceOptions from '@secret-agent/core-interfaces/IWaitForResourceOptions';
import IWaitForElementOptions from '@secret-agent/core-interfaces/IWaitForElementOptions';
import { ILocationTrigger } from '@secret-agent/core-interfaces/Location';
import Request from 'awaited-dom/impl/official-klasses/Request';
import IWaitForOptions from '@secret-agent/core-interfaces/IWaitForOptions';
import { IElementIsolate } from 'awaited-dom/base/interfaces/isolate';
import CSSStyleDeclaration from 'awaited-dom/impl/official-klasses/CSSStyleDeclaration';
import IAgentMeta from '@secret-agent/core-interfaces/IAgentMeta';
import IScreenshotOptions from '@secret-agent/core-interfaces/IScreenshotOptions';
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
import IAgentCreateOptions from '../interfaces/IAgentCreateOptions';
import ScriptInstance from './ScriptInstance';
import AwaitedEventTarget from './AwaitedEventTarget';
import IAgentDefaults from '../interfaces/IAgentDefaults';
import CoreSession from './CoreSession';
import IAgentConfigureOptions from '../interfaces/IAgentConfigureOptions';
import ConnectionFactory from '../connections/ConnectionFactory';
import ConnectionToCore from '../connections/ConnectionToCore';
import DisconnectedFromCoreError from '../connections/DisconnectedFromCoreError';
import FrameEnvironment, { getCoreFrameEnvironment } from './FrameEnvironment';

export const DefaultOptions = {
  defaultBlockedResourceTypes: [BlockedResourceType.None],
  defaultUserProfile: {},
};
const scriptInstance = new ScriptInstance();

const { getState, setState } = StateMachine<Agent, IState>();

export interface IState {
  connection: SessionConnection;
  isClosing: boolean;
  options: ICreateSessionOptions & Pick<IAgentCreateOptions, 'connectionToCore' | 'showReplay'>;
}

const propertyKeys: (keyof Agent)[] = [
  'document',
  'sessionId',
  'meta',
  'tabs',
  'frameEnvironments',
  'mainFrameEnvironment',
  'coreHost',
  'activeTab',
  'sessionName',
  'url',
  'lastCommandId',
  'Request',
];

export default class Agent extends AwaitedEventTarget<{ close: void }> {
  protected static options: IAgentDefaults = { ...DefaultOptions };

  constructor(options: IAgentCreateOptions = {}) {
    super(() => {
      return {
        target: getState(this).connection.getCoreSessionOrReject(),
      };
    });
    initializeConstantsAndProperties(this, [], propertyKeys);
    bindFunctions(this);

    options.blockedResourceTypes =
      options.blockedResourceTypes || Agent.options.defaultBlockedResourceTypes;
    options.userProfile = options.userProfile || Agent.options.defaultUserProfile;

    const sessionName = scriptInstance.generateSessionName(options.name);
    delete options.name;
    const connection = new SessionConnection(this);

    setState(this, {
      connection,
      isClosing: false,
      options: {
        ...options,
        sessionName,
        scriptInstanceMeta: scriptInstance.meta,
      },
    });
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

  public get lastCommandId(): Promise<number> {
    return this.activeTab.lastCommandId;
  }

  public get mainFrameEnvironment(): FrameEnvironment {
    return this.activeTab.mainFrameEnvironment;
  }

  public get sessionId(): Promise<string> {
    const coreSession = getState(this).connection.getCoreSessionOrReject();
    return coreSession.then(x => x.sessionId);
  }

  public get sessionName(): Promise<string> {
    return Promise.resolve(getState(this).options.sessionName);
  }

  public get meta(): Promise<IAgentMeta> {
    const coreSession = getState(this).connection.getCoreSessionOrReject();
    return coreSession.then(x => x.getAgentMeta());
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

  public async configure(configureOptions: IAgentConfigureOptions): Promise<void> {
    const { options } = getState(this);
    setState(this, {
      options: {
        ...options,
        ...configureOptions,
      },
    });

    const connection = getState(this).connection;
    // if already setup, call configure
    if (connection.hasConnected) {
      if (
        configureOptions.showReplay !== undefined ||
        configureOptions.connectionToCore !== undefined
      ) {
        throw new Error(
          'This agent has already connected to a Core - it cannot be reconnected. You can use a Handler, or initialize the connection earlier in your script.',
        );
      }
    } else {
      const session = await connection.getCoreSessionOrReject();
      await session.configure(options);
    }
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
    const coreFrame = await getCoreFrameEnvironment(this.activeTab.mainFrameEnvironment);
    await Interactor.run(coreFrame, [{ click: mousePosition }]);
  }

  public async getFrameEnvironment(
    frameElement: IElementIsolate,
  ): Promise<FrameEnvironment | null> {
    return await this.activeTab.getFrameEnvironment(frameElement);
  }

  public async interact(...interactions: IInteractions): Promise<void> {
    const coreFrame = await getCoreFrameEnvironment(this.activeTab.mainFrameEnvironment);
    await Interactor.run(coreFrame, interactions);
  }

  public async scrollTo(mousePosition: IMousePosition): Promise<void> {
    const coreFrame = await getCoreFrameEnvironment(this.activeTab.mainFrameEnvironment);
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

  public reload(timeoutMs?: number): Promise<void> {
    return this.activeTab.reload(timeoutMs);
  }

  public fetch(request: Request | string, init?: IRequestInit): Promise<Response> {
    return this.activeTab.fetch(request, init);
  }

  public getComputedStyle(element: IElementIsolate, pseudoElement?: string): CSSStyleDeclaration {
    return this.activeTab.getComputedStyle(element, pseudoElement);
  }

  public getJsValue<T>(path: string): Promise<{ value: T; type: string }> {
    return this.activeTab.getJsValue<T>(path);
  }

  public isElementVisible(element: IElementIsolate): Promise<boolean> {
    return this.activeTab.isElementVisible(element);
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

  public waitForElement(element: ISuperElement, options?: IWaitForElementOptions): Promise<void> {
    return this.activeTab.waitForElement(element, options);
  }

  public waitForLocation(trigger: ILocationTrigger, options?: IWaitForOptions): Promise<void> {
    return this.activeTab.waitForLocation(trigger, options);
  }

  public waitForMillis(millis: number): Promise<void> {
    return this.activeTab.waitForMillis(millis);
  }

  /////// THENABLE ///////////////////////////////////////////////////////////////////////////////////////////////////

  public async then<TResult1 = Agent, TResult2 = never>(
    onfulfilled?:
      | ((value: Omit<Agent, 'then'>) => PromiseLike<TResult1> | TResult1)
      | undefined
      | null,
    onrejected?: ((reason: any) => PromiseLike<TResult2> | TResult2) | undefined | null,
  ): Promise<TResult1 | TResult2> {
    try {
      this.then = null;
      await getState(this).connection.getCoreSessionOrReject();
      return onfulfilled(this);
    } catch (err) {
      return onrejected(err);
    }
  }
}

// This class will lazily connect to core on first access of the tab properties
class SessionConnection {
  public hasConnected = false;

  public get activeTab(): Tab {
    this.getCoreSessionOrReject().catch(() => null);
    return this._activeTab;
  }

  public set activeTab(value: Tab) {
    this._activeTab = value;
  }

  public get host(): Promise<string> {
    return this._connection?.hostOrError.then(x => {
      if (x instanceof Error) throw x;
      return x;
    });
  }

  private _connection: ConnectionToCore;
  private _coreSession: Promise<CoreSession | Error>;
  private _activeTab: Tab;
  private _tabs: Tab[] = [];

  constructor(private agent: Agent) {}

  public async refreshedTabs(): Promise<Tab[]> {
    const session = await this.getCoreSessionOrReject();
    const coreTabs = await session.getTabs();
    const tabIds = await Promise.all(this._tabs.map(x => x.tabId));
    for (const coreTab of coreTabs) {
      const hasTab = tabIds.includes(coreTab.tabId);
      if (!hasTab) {
        const tab = createTab(this.agent, Promise.resolve(coreTab));
        this._tabs.push(tab);
      }
    }
    return this._tabs;
  }

  public async close(): Promise<void> {
    if (!this.hasConnected) return;
    const sessionOrError = await this._coreSession;
    if (sessionOrError instanceof CoreSession) {
      await sessionOrError.close();
    }
  }

  public closeTab(tab: Tab): void {
    const tabIdx = this._tabs.indexOf(tab);
    this._tabs.splice(tabIdx, 1);
    if (this._tabs.length) {
      this._activeTab = this._tabs[0];
    }
  }

  public addTab(tab: Tab): void {
    this._tabs.push(tab);
  }

  public async getCoreSessionOrReject(): Promise<CoreSession> {
    if (this.hasConnected) {
      const coreSession = await this._coreSession;
      if (coreSession instanceof CoreSession) return coreSession;
      throw coreSession;
    }
    this.hasConnected = true;
    const { showReplay, connectionToCore, ...options } = getState(this.agent).options;

    const connection = ConnectionFactory.createConnection(
      connectionToCore ?? { isPersistent: false },
    );
    this._connection = connection;

    this._coreSession = connection.createSession(options);

    const defaultShowReplay = Boolean(JSON.parse(process.env.SA_SHOW_REPLAY ?? 'true'));

    if (showReplay ?? defaultShowReplay) {
      this._coreSession = this._coreSession.then(async x => {
        if (x instanceof CoreSession) await scriptInstance.launchReplay(x);
        return x;
      });
    }

    const session = this._coreSession.then(value => {
      if (value instanceof CoreSession) return value;
      throw value;
    });

    const coreTab = session.then(x => x.firstTab).catch(err => err);
    this._activeTab = createTab(this.agent, coreTab);
    this._tabs = [this._activeTab];

    return await session;
  }
}
