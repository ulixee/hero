// eslint-disable-next-line max-classes-per-file
import { RenderingOption } from '@secret-agent/core-interfaces/ITabOptions';
import StateMachine from 'awaited-dom/base/StateMachine';
import initializeConstantsAndProperties from 'awaited-dom/base/initializeConstantsAndProperties';
import { bindFunctions } from '@secret-agent/commons/utils';
import ICreateSessionOptions from '@secret-agent/core-interfaces/ICreateSessionOptions';
import SuperDocument from 'awaited-dom/impl/super-klasses/SuperDocument';
import IDomStorage from '@secret-agent/core-interfaces/IDomStorage';
import IConfigureSessionOptions from '@secret-agent/core-interfaces/IConfigureSessionOptions';
import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import Response from 'awaited-dom/impl/official-klasses/Response';
import { ISuperElement } from 'awaited-dom/base/interfaces/super';
import IWaitForResourceOptions from '@secret-agent/core-interfaces/IWaitForResourceOptions';
import IWaitForElementOptions from '@secret-agent/core-interfaces/IWaitForElementOptions';
import { ILocationTrigger } from '@secret-agent/core-interfaces/Location';
import Request from 'awaited-dom/impl/official-klasses/Request';
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
import CoreClient from './CoreClient';
import AwaitedEventTarget from './AwaitedEventTarget';
import CoreTab from './CoreTab';
import IAgentDefaults from '../interfaces/IAgentDefaults';
import CoreSession from './CoreSession';

export const DefaultOptions = {
  defaultRenderingOptions: [RenderingOption.All],
  defaultUserProfile: {},
};
const scriptInstance = new ScriptInstance();
const shouldHideReplay =
  process.env.SA_SHOW_REPLAY === 'false' || process.env.SA_SHOW_REPLAY === '0';

const { getState, setState } = StateMachine<Agent, IState>();

export interface IState {
  connection: SessionConnection;
  isClosing: boolean;
  sessionOptions: ICreateSessionOptions;
}

const propertyKeys: (keyof Agent)[] = [
  'document',
  'sessionId',
  'tabs',
  'activeTab',
  'sessionName',
  'url',
  'lastCommandId',
  'Request',
];

export default class Agent extends AwaitedEventTarget<{ close: void }> {
  protected static options: IAgentDefaults = { ...DefaultOptions };

  constructor(
    getCoreClient: () => Promise<CoreClient> | CoreClient,
    options: IAgentCreateOptions = {},
  ) {
    super(() => {
      return {
        target: getState(this).connection.coreSession,
      };
    });
    initializeConstantsAndProperties(this, [], propertyKeys);
    bindFunctions(this);

    options.renderingOptions = options.renderingOptions || Agent.options.defaultRenderingOptions;
    options.userProfile = options.userProfile || Agent.options.defaultUserProfile;

    const sessionName = scriptInstance.generateSessionName(options.name);
    delete options.name;
    const connection = new SessionConnection(
      this,
      getCoreClient,
      options.showReplay ?? !shouldHideReplay,
    );

    setState(this, {
      connection,
      isClosing: false,
      sessionOptions: {
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

  public get lastCommandId(): Promise<number> {
    return this.activeTab.lastCommandId;
  }

  public get sessionId(): Promise<string> {
    const { coreSession } = getState(this).connection;
    return coreSession.then(x => x.sessionId);
  }

  public get sessionName(): Promise<string> {
    return Promise.resolve(getState(this).sessionOptions.sessionName);
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

  public get Request(): typeof Request {
    return this.activeTab.Request;
  }

  // METHODS

  public close(): Promise<void> {
    const { isClosing, connection } = getState(this);
    if (isClosing) return;
    setState(this, { isClosing: true });

    return connection.close();
  }

  public async closeTab(tab: Tab): Promise<void> {
    await tab.close();
  }

  public async configure(options: IConfigureSessionOptions): Promise<void> {
    const sessionOptions = getState(this).sessionOptions;
    setState(this, {
      sessionOptions: {
        ...sessionOptions,
        ...options,
      },
    });

    const connection = getState(this).connection;
    // if already setup, call configure
    if (connection.hasConnected) {
      const session = await connection.coreSession;
      await session.configure(options);
    }
  }

  public async focusTab(tab: Tab): Promise<void> {
    await tab.focus();
  }

  public async waitForNewTab(): Promise<Tab> {
    const coreTab = await getCoreTab(this.activeTab);
    const newCoreTab = coreTab.waitForNewTab();
    const tab = createTab(this, newCoreTab);
    getState(this).connection.tabs.push(tab);
    return tab;
  }

  // INTERACT METHODS

  public async click(mousePosition: IMousePosition): Promise<void> {
    const coreTab = await getCoreTab(this.activeTab);
    await Interactor.run(coreTab, [{ click: mousePosition }]);
  }

  public async interact(...interactions: IInteractions): Promise<void> {
    const coreTab = await getCoreTab(this.activeTab);
    await Interactor.run(coreTab, interactions);
  }

  public async scrollTo(mousePosition: IMousePosition): Promise<void> {
    const coreTab = await getCoreTab(this.activeTab);
    await Interactor.run(coreTab, [{ [Command.scroll]: mousePosition }]);
  }

  public async type(...typeInteractions: ITypeInteraction[]): Promise<void> {
    const coreTab = await getCoreTab(this.activeTab);
    await Interactor.run(
      coreTab,
      typeInteractions.map(t => ({ type: t })),
    );
  }

  public async exportUserProfile(): Promise<IUserProfile> {
    const coreTab = await getCoreTab(this.activeTab);
    return await coreTab.exportUserProfile();
  }

  /////// METHODS THAT DELEGATE TO ACTIVE TAB //////////////////////////////////////////////////////////////////////////

  public goto(href: string): Promise<Resource> {
    return this.activeTab.goto(href);
  }

  public goBack(): Promise<string> {
    return this.activeTab.goBack();
  }

  public goForward(): Promise<string> {
    return this.activeTab.goForward();
  }

  public fetch(request: Request | string, init?: IRequestInit): Promise<Response> {
    return this.activeTab.fetch(request, init);
  }

  public getJsValue<T>(path: string): Promise<{ value: T; type: string }> {
    return this.activeTab.getJsValue<T>(path);
  }

  public isElementVisible(element: ISuperElement): Promise<boolean> {
    return this.activeTab.isElementVisible(element);
  }

  public waitForAllContentLoaded(): Promise<void> {
    return this.activeTab.waitForAllContentLoaded();
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

  public waitForLocation(trigger: ILocationTrigger): Promise<void> {
    return this.activeTab.waitForLocation(trigger);
  }

  public waitForMillis(millis: number): Promise<void> {
    return this.activeTab.waitForMillis(millis);
  }

  public waitForWebSocket(url: string | RegExp): Promise<void> {
    return this.activeTab.waitForWebSocket(url);
  }

  /////// THENABLE ///////////////////////////////////////////////////////////////////////////////////////////////////

  public then<TResult1 = Agent, TResult2 = never>(
    onfulfilled?:
      | ((value: Omit<Agent, 'then'>) => PromiseLike<TResult1> | TResult1)
      | undefined
      | null,
    onrejected?: ((reason: any) => PromiseLike<TResult2> | TResult2) | undefined | null,
  ): Promise<TResult1 | TResult2> {
    const session = getState(this).connection.coreSession;
    return session
      .then(() => {
        this.then = null;
        return this;
      })
      .then(onfulfilled, onrejected);
  }
}

// This class will lazily connect to core on first access of the tab properties
class SessionConnection {
  public hasConnected = false;
  public get coreSession(): Promise<CoreSession> {
    return this._coreSession ?? this.connectSession();
  }

  public get activeTab(): Tab {
    this.connectSession();
    return this._activeTab;
  }

  public set activeTab(value: Tab) {
    this._activeTab = value;
  }

  public get tabs(): Tab[] {
    if (!this._tabs) this._tabs = [this.activeTab];
    return this._tabs;
  }

  private _coreSession: Promise<CoreSession>;
  private _activeTab: Tab;
  private _tabs: Tab[];

  constructor(
    private agent: Agent,
    private getCoreClient: () => Promise<CoreClient> | CoreClient,
    private showReplay: boolean,
  ) {}

  public async refreshedTabs(): Promise<Tab[]> {
    const session = await this.coreSession;
    const coreTabs = await session.getTabs();
    const tabIds = await Promise.all(this.tabs.map(x => x.tabId));
    for (const coreTab of coreTabs) {
      const hasTab = tabIds.includes(coreTab.tabId);
      if (!hasTab) {
        const tab = createTab(this.agent, Promise.resolve(coreTab));
        this.tabs.push(tab);
      }
    }
    return this.tabs;
  }

  public async close(): Promise<void> {
    const session = await this.coreSession;
    return session.close();
  }

  public getCoreTab(): Promise<CoreTab> {
    return getCoreTab(this.activeTab);
  }

  private connectSession(): Promise<CoreSession> {
    if (this.hasConnected) return this._coreSession;
    this.hasConnected = true;
    const sessionOptions = getState(this.agent).sessionOptions;

    const newSession = Promise.resolve(this.getCoreClient()).then(x =>
      x.createSession(sessionOptions),
    );
    this._coreSession = newSession;

    if (this.showReplay) {
      scriptInstance.launchReplay(sessionOptions.sessionName, newSession);
    }

    const coreTab = newSession.then(x => x.firstTab);
    this._activeTab = createTab(this.agent, coreTab);
    this._tabs = [this._activeTab];
    return newSession;
  }
}
