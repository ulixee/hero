// setup must go first
import './lib/SetupAwaitedHandler';

import { ILocationTrigger, LocationStatus } from '@secret-agent/core-interfaces/Location';
import { RenderingOption } from '@secret-agent/core-interfaces/ITabOptions';
import initializeConstantsAndProperties from 'awaited-dom/base/initializeConstantsAndProperties';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import { ISuperElement } from 'awaited-dom/base/interfaces/super';
import IDomStorage from '@secret-agent/core-interfaces/IDomStorage';
import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';
import IWaitForResourceOptions from '@secret-agent/core-interfaces/IWaitForResourceOptions';
import IWaitForElementOptions from '@secret-agent/core-interfaces/IWaitForElementOptions';
import StateMachine from 'awaited-dom/base/StateMachine';
import Request from 'awaited-dom/impl/official-klasses/Request';
import { bindFunctions } from '@secret-agent/commons/utils';
import ICreateSessionOptions from '@secret-agent/core-interfaces/ICreateSessionOptions';
import Response from 'awaited-dom/impl/official-klasses/Response';
import SuperDocument from 'awaited-dom/impl/super-klasses/SuperDocument';
import ICreateSecretAgentOptions from './interfaces/ICreateSecretAgentOptions';
import CoreClient from './lib/CoreClient';
import ISecretAgentClass, {
  ISecretAgentConfigureOptions,
  SecretAgentStatics,
} from './interfaces/ISecretAgentClass';
import ISecretAgent, { ISecretAgentEvents } from './interfaces/ISecretAgent';
import CoreTab from './lib/CoreTab';
import Tab, { createTab, getCoreTab } from './lib/Tab';
import IInteractions, {
  Command,
  IMousePosition,
  ITypeInteraction,
} from './interfaces/IInteractions';
import Interactor from './lib/Interactor';
import IWaitForResourceFilter from './interfaces/IWaitForResourceFilter';
import AwaitedEventTarget from './lib/AwaitedEventTarget';
import ScriptInstance from './lib/ScriptInstance';
import Resource from './lib/Resource';
import WebsocketResource from './lib/WebsocketResource';
import Signals = NodeJS.Signals;

const DefaultOptions = {
  defaultRenderingOptions: [RenderingOption.All],
  defaultUserProfile: {},
};

const scriptInstance = new ScriptInstance();

export function SecretAgentClientGenerator(
  initArgs?: IClientInitArgs,
): {
  SecretAgent: ISecretAgentClass;
  coreClient: CoreClient;
} {
  const coreClient = new CoreClient();
  const { getState, setState } = StateMachine<ISecretAgent, IState>();

  const propertyKeys: (keyof SecretAgent)[] = [
    'document',
    'sessionId',
    'tabs',
    'activeTab',
    'sessionName',
    'url',
    'lastCommandId',
    'Request',
  ];

  @SecretAgentStatics
  class SecretAgent extends AwaitedEventTarget<ISecretAgentEvents, IState> implements ISecretAgent {
    private static options: ISecretAgentConfigureOptions = { ...DefaultOptions };

    constructor(options: ICreateSecretAgentOptions = {}) {
      super();
      initializeConstantsAndProperties(this, [], propertyKeys);
      bindFunctions(this);

      options.renderingOptions =
        options.renderingOptions || SecretAgent.options.defaultRenderingOptions;
      options.userProfile = options.userProfile || SecretAgent.options.defaultUserProfile;

      const sessionName = scriptInstance.generateSessionName(options.name);
      delete options.name;

      let showReplay = true;
      if (options.showReplay !== undefined) {
        showReplay = options.showReplay;
      } else if (process.env.SA_SHOW_REPLAY === 'false' || process.env.SA_SHOW_REPLAY === '0') {
        showReplay = false;
      }

      const sessionOptions: ICreateSessionOptions = {
        ...options,
        sessionName,
        scriptInstanceMeta: scriptInstance.meta,
      };
      const coreTab = coreClient.createTab(sessionOptions);
      if (showReplay) {
        scriptInstance.launchReplay(sessionName, coreTab);
      }

      const readyPromise = coreTab.then(() => {
        this.then = null;
        return this;
      });

      const activeTab = createTab(this, coreTab);
      setState(this, {
        activeTab,
        get coreTab() {
          return getCoreTab(this.activeTab);
        },
        sessionName,
        isClosing: false,
        coreClient,
        tabs: [activeTab],
        readyPromise,
      });
    }

    public get activeTab(): Tab {
      return getState(this).activeTab;
    }

    public get document(): SuperDocument {
      return this.activeTab.document;
    }

    public get lastCommandId(): Promise<number> {
      return this.activeTab.lastCommandId;
    }

    public get sessionId(): Promise<string> {
      const { activeTab } = getState(this);

      return getCoreTab(activeTab).then(x => x.sessionId);
    }

    public get sessionName(): Promise<string> {
      return Promise.resolve(getState(this).sessionName);
    }

    public get storage(): Promise<IDomStorage> {
      const coreTab = getCoreTab(this.activeTab);
      return coreTab.then(async tab => {
        const profile = await tab.exportUserProfile();
        return profile.storage;
      });
    }

    public get tabs(): Promise<Tab[]> {
      return getSessionTabs(this);
    }

    public get url(): Promise<string> {
      return this.activeTab.url;
    }

    public get Request(): typeof Request {
      return this.activeTab.Request;
    }

    // METHODS

    public async close(): Promise<void> {
      const { isClosing, activeTab } = getState(this);
      if (isClosing) return;
      setState(this, { isClosing: true });
      const coreTab = await getCoreTab(activeTab);

      await coreTab.closeSession();
    }

    public async closeTab(tab: Tab): Promise<void> {
      await tab.close();
    }

    public async focusTab(tab: Tab): Promise<void> {
      await tab.focus();
    }

    public async waitForNewTab(): Promise<Tab> {
      const coreTab = await getCoreTab(this.activeTab);
      const newCoreTab = coreTab.waitForNewTab();
      return createTab(this, newCoreTab);
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

    public then<TResult1 = SecretAgent, TResult2 = never>(
      onfulfilled?: ((value: SecretAgent) => PromiseLike<TResult1> | TResult1) | undefined | null,
      onrejected?: ((reason: any) => PromiseLike<TResult2> | TResult2) | undefined | null,
    ): Promise<TResult1 | TResult2> {
      const readyPromise = getState(this).readyPromise;
      return readyPromise.then(onfulfilled, onrejected);
    }

    public static async configure(options: Partial<ISecretAgentConfigureOptions>): Promise<void> {
      this.options = { ...DefaultOptions, ...this.options, ...options };
      await coreClient.configure(options);
    }

    public static async prewarm(
      options: Partial<ISecretAgentConfigureOptions> = {},
    ): Promise<void> {
      this.options = { ...DefaultOptions, ...this.options, ...options };
      await coreClient.prewarm(options);
    }

    public static async recordUnhandledError(error: Error): Promise<void> {
      await coreClient.logUnhandledError(error);
    }

    public static async shutdown(error?: Error): Promise<void> {
      await coreClient.shutdown(error);
    }
  }

  if (initArgs?.handleShutdownSignals) {
    ['exit', 'SIGTERM', 'SIGINT', 'SIGQUIT'].forEach(name => {
      process.once(name as Signals, async () => await SecretAgent.shutdown());
    });
  }

  if (initArgs?.captureUncaughtClientErrors) {
    process.on('uncaughtException', async (error: Error) => {
      // keep core node behavior intact
      process.stderr.write(`${error.stack}\n`);
      await SecretAgent.shutdown(error);
      process.exit(1);
    });

    process.on('unhandledRejection', async (error: Error) => {
      // keep core node behavior intact
      process.stderr.write(`${error.stack}\n`);
      await SecretAgent.recordUnhandledError(error);
    });
  }

  async function getSessionTabs(agent: SecretAgent): Promise<Tab[]> {
    const state = getState(agent);
    const tabs = state.tabs;
    const sessionId = await agent.sessionId;
    const coreTabs = await state.coreClient.getTabsForSession(sessionId);
    const tabIds = await Promise.all(tabs.map(x => x.tabId));
    for (const coreTab of coreTabs) {
      const hasTab = tabIds.some(x => x === coreTab.tabId);
      if (!hasTab) {
        const tab = createTab(agent, Promise.resolve(coreTab));
        tabs.push(tab);
      }
    }
    return tabs;
  }

  return { SecretAgent, coreClient };
}

interface IClientInitArgs {
  handleShutdownSignals: boolean;
  captureUncaughtClientErrors: boolean;
}

interface IState {
  activeTab: Tab;
  sessionName: string;
  isClosing: boolean;
  coreTab: Promise<CoreTab>;
  coreClient: CoreClient;
  tabs: Tab[];
  readyPromise: Promise<ISecretAgent>;
}

export { LocationStatus, ISecretAgent, ISecretAgentClass };
