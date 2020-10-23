import initializeConstantsAndProperties from 'awaited-dom/base/initializeConstantsAndProperties';
import StateMachine from 'awaited-dom/base/StateMachine';
import { ILocationTrigger } from '@secret-agent/core-interfaces/Location';
import ICreateSessionOptions from '@secret-agent/core-interfaces/ICreateSessionOptions';
import ISessionOptions from '@secret-agent/core-interfaces/ISessionOptions';
import { ISuperElement } from 'awaited-dom/base/interfaces/super';
import IWaitForElementOptions from '@secret-agent/core-interfaces/IWaitForElementOptions';
import IWaitForResourceOptions from '@secret-agent/core-interfaces/IWaitForResourceOptions';
import { bindFunctions } from '@secret-agent/commons/utils';
import Request from 'awaited-dom/impl/official-klasses/Request';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import IInteractions, { IMousePosition, ITypeInteraction } from '../interfaces/IInteractions';
import CoreClient from './CoreClient';
import CoreTab from './CoreTab';
import ScriptInstance from './ScriptInstance';
import User, { createUser } from './User';
import ICreateBrowserOptions from '../interfaces/ICreateBrowserOptions';
import AwaitedEventTarget from './AwaitedEventTarget';
import IBrowser from '../interfaces/IBrowser';
import IWaitForResourceFilter from '../interfaces/IWaitForResourceFilter';
import Tab, { createTab, getCoreTab } from './Tab';

const { getState, setState } = StateMachine<Browser, IState>();
const scriptInstance = new ScriptInstance();

interface IState {
  activeTab: Tab;
  sessionName: string;
  user: User;
  isClosing: boolean;
  coreTab: CoreTab;
  coreClient: CoreClient;
  tabs: Tab[];
}

interface IEventType {
  close: Browser;
}

const propertyKeys: (keyof Browser)[] = [
  'document',
  'sessionId',
  'tabs',
  'activeTab',
  'sessionName',
  'user',
  'url',
  'cookies',
  'lastCommandId',
  'Request',
];

export default class Browser extends AwaitedEventTarget<IEventType, IState> implements IBrowser {
  constructor(coreTab: CoreTab, coreClient: CoreClient, sessionName: string) {
    super();
    initializeConstantsAndProperties(this, [], propertyKeys);

    const activeTab = createTab(this, coreTab);
    setState(this, {
      activeTab,
      get coreTab() {
        return getCoreTab(this.activeTab);
      },
      sessionName,
      user: createUser(this),
      isClosing: false,
      coreClient,
      tabs: [activeTab],
    });

    bindFunctions(this);
  }

  public get sessionId() {
    const { activeTab } = getState(this);
    const coreTab = getCoreTab(activeTab);
    return coreTab.sessionId;
  }

  public get sessionName() {
    return getState(this).sessionName;
  }

  public get user() {
    return getState(this).user;
  }

  public get cookies() {
    return this.activeTab.cookies;
  }

  public get document() {
    return this.activeTab.document;
  }

  public get url() {
    return this.activeTab.url;
  }

  public get lastCommandId() {
    return this.activeTab.lastCommandId;
  }

  public get Request() {
    return this.activeTab.Request;
  }

  public get activeTab() {
    return getState(this).activeTab;
  }

  public get tabs() {
    return getSessionTabs(this);
  }

  // METHODS

  public async close(): Promise<void> {
    const { isClosing, activeTab } = getState(this);
    if (isClosing) return;
    setState(this, { isClosing: true });
    const coreTab = getCoreTab(activeTab);

    await coreTab.closeSession();
  }

  public async configure(options: ISessionOptions): Promise<void> {
    const clientTabSession = getCoreTab(this.activeTab);
    return clientTabSession.configure(options);
  }

  public async focusTab(tab: Tab): Promise<void> {
    await tab.focus();
  }

  public async closeTab(tab: Tab): Promise<void> {
    await tab.close();
  }

  public async waitForNewTab() {
    const coreClient = getCoreTab(this.activeTab);
    const coreTab = await coreClient.waitForNewTab();
    return createTab(this, coreTab);
  }

  /////// METHODS THAT DELEGATE TO ACTIVE TAB //////////////////////////////////////////////////////////////////////////

  public async goto(href: string) {
    return this.activeTab.goto(href);
  }

  public async goBack() {
    return this.activeTab.goBack();
  }

  public async goForward() {
    return this.activeTab.goForward();
  }

  public async fetch(request: Request | string, init?: IRequestInit) {
    return this.activeTab.fetch(request, init);
  }

  public getJsValue<T>(path: string) {
    return this.activeTab.getJsValue<T>(path);
  }

  public isElementVisible(element: ISuperElement) {
    return this.activeTab.isElementVisible(element);
  }

  public async waitForAllContentLoaded() {
    return this.activeTab.waitForAllContentLoaded();
  }

  public async waitForResource(filter: IWaitForResourceFilter, options?: IWaitForResourceOptions) {
    return this.activeTab.waitForResource(filter, options);
  }

  public async waitForElement(element: ISuperElement, options?: IWaitForElementOptions) {
    return this.activeTab.waitForElement(element, options);
  }

  public async waitForLocation(trigger: ILocationTrigger) {
    return this.activeTab.waitForLocation(trigger);
  }

  public async waitForMillis(millis: number) {
    return this.activeTab.waitForMillis(millis);
  }

  public async waitForWebSocket(url: string | RegExp) {
    return this.activeTab.waitForWebSocket(url);
  }

  /////// METHODS THAT DELEGATE TO USER ////////////////////////////////////////////////////////////////////////////////

  public async click(mousePosition: IMousePosition) {
    return this.user.click(mousePosition);
  }

  public async scrollTo(mousePosition: IMousePosition) {
    return this.user.scrollTo(mousePosition);
  }

  public async type(...typeInteractions: ITypeInteraction[]) {
    return this.user.type(...typeInteractions);
  }

  public async interact(...interactions: IInteractions) {
    return this.user.interact(...interactions);
  }
}

// CREATE

export async function createBrowser(
  options: ICreateBrowserOptions,
  coreClient: CoreClient,
): Promise<Browser> {
  const sessionName = scriptInstance.generateSessionName(options.name);
  delete options.name;

  const sessionOptions: ICreateSessionOptions = {
    ...options,
    sessionName,
    scriptInstanceMeta: scriptInstance.meta,
  };
  const coreTab = await coreClient.createTab(sessionOptions);

  let showReplay = true;
  if (options.showReplay !== undefined) {
    showReplay = options.showReplay;
  } else if (process.env.SA_SHOW_REPLAY === 'false' || process.env.SA_SHOW_REPLAY === '0') {
    showReplay = false;
  }

  if (showReplay) {
    scriptInstance.launchReplay(sessionName, coreTab);
  }
  return new Browser(coreTab, coreClient, sessionName);
}

async function getSessionTabs(browser: Browser) {
  const { coreClient, tabs } = getState(browser);
  const coreTabs = await coreClient.getTabsForSession(browser.sessionId);
  for (const coreTab of coreTabs) {
    const hasTab = tabs.some(x => x.tabId === coreTab.tabId);
    if (!hasTab) {
      const tab = createTab(browser, coreTab);
      tabs.push(tab);
    }
  }
  return tabs;
}
