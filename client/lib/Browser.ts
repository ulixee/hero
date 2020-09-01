import SuperDocument from 'awaited-dom/impl/super-klasses/SuperDocument';
import Response from 'awaited-dom/impl/official-klasses/Response';
import { createSuperDocument } from 'awaited-dom/impl/create';
import initializeConstantsAndProperties from 'awaited-dom/base/initializeConstantsAndProperties';
import StateMachine from 'awaited-dom/base/StateMachine';
import { ILocationTrigger } from '@secret-agent/core-interfaces/Location';
import ICreateSessionOptions from '@secret-agent/core-interfaces/ICreateSessionOptions';
import ISessionOptions from '@secret-agent/core-interfaces/ISessionOptions';
import AwaitedPath from 'awaited-dom/base/AwaitedPath';
import { ISuperElement } from 'awaited-dom/base/interfaces/super';
import { ICookie } from '@secret-agent/core-interfaces/ICookie';
import IWaitForElementOptions from '@secret-agent/core-interfaces/IWaitForElementOptions';
import IWaitForResourceOptions from '@secret-agent/core-interfaces/IWaitForResourceOptions';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import Request from 'awaited-dom/impl/official-klasses/Request';
import { bindFunctions } from '@secret-agent/commons/utils';
import IAwaitedOptions from '../interfaces/IAwaitedOptions';
import IInteractions, { IMousePosition, ITypeInteraction } from '../interfaces/IInteractions';
import CoreClient from './CoreClient';
import CoreTab from './CoreTab';
import Resource from './Resource';
import WebsocketResource from './WebsocketResource';
import ScriptInstance from './ScriptInstance';
import User, { createUser } from './User';
import Fetcher from './Fetcher';
import ICreateBrowserOptions from '../interfaces/ICreateBrowserOptions';
import AwaitedEventTarget from './AwaitedEventTarget';
import IBrowser from '../interfaces/IBrowser';
import RequestGenerator from './Request';
import IWaitForResourceFilter from '../interfaces/IWaitForResourceFilter';
import Tab, { createTab, getTabSession } from './Tab';

const { getState, setState } = StateMachine<IBrowser, IState>();
const scriptInstance = new ScriptInstance();

interface IState {
  tabs: Tab[];
  activeTab: Tab;
  sessionName: string;
  user: User;
  isClosing: boolean;
}

interface IEventType {
  close: Browser;
  resource: Resource | WebsocketResource;
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

export default class Browser extends AwaitedEventTarget<IEventType> implements IBrowser {
  constructor(coreTab: CoreTab, sessionName: string) {
    super();
    initializeConstantsAndProperties(this, [], propertyKeys);

    const activeTab = createTab(this, coreTab);
    setState(this, {
      tabs: [activeTab],
      activeTab,
      sessionName,
      user: createUser(this),
      isClosing: false,
    });

    bindFunctions(this);
  }

  public get cookies(): Promise<ICookie[]> {
    return this.activeTab.cookies;
  }

  public get document(): SuperDocument {
    const awaitedPath = new AwaitedPath('document');
    const coreTab = getTabSession(this.activeTab);
    const awaitedOptions = { browser: this, coreTab };
    return createSuperDocument<IAwaitedOptions>(awaitedPath, awaitedOptions) as SuperDocument;
  }

  public get Request(): typeof Request {
    return RequestGenerator(getTabSession(this.activeTab));
  }

  public get user(): User {
    return getState(this).user;
  }

  public get url(): Promise<string> {
    return this.activeTab.url;
  }

  public get sessionId(): string {
    const { activeTab } = getState(this);
    const coreTab = getTabSession(activeTab);
    return coreTab.sessionId;
  }

  public get sessionName(): string {
    return getState(this).sessionName;
  }

  public get lastCommandId(): number {
    return this.activeTab.lastCommandId;
  }

  public get activeTab() {
    return getState(this).activeTab;
  }

  public get tabs() {
    return [...getState(this).tabs];
  }

  // METHODS

  public fetch(request: Request | string, init?: IRequestInit): Promise<Response> {
    return Fetcher.fetch(this, request, init);
  }

  public async close(): Promise<void> {
    const { isClosing, activeTab } = getState(this);
    if (isClosing) return;
    setState(this, { isClosing: true });

    const tabSession = getTabSession(activeTab);
    await tabSession.close();
  }

  public async getJsValue(path: string): Promise<any> {
    const clientTabSession = getTabSession(this.activeTab);
    return clientTabSession.getJsValue(path);
  }

  public async configure(options: ISessionOptions): Promise<void> {
    const clientTabSession = getTabSession(this.activeTab);
    return clientTabSession.configure(options);
  }

  public async focusTab(tab: Tab): Promise<void> {
    await tab.focus();
  }

  public async closeTab(tab: Tab): Promise<void> {
    await tab.close();
  }

  // METHODS THAT DELEGATE TO USER

  public async goto(href: string) {
    return this.user.goto(href);
  }

  public async click(mousePosition: IMousePosition) {
    return this.user.click(mousePosition);
  }

  public async interact(...interactions: IInteractions) {
    return this.user.interact(...interactions);
  }

  public async type(...typeInteractions: ITypeInteraction[]) {
    return this.user.type(...typeInteractions);
  }

  public async waitForAllContentLoaded() {
    return this.user.waitForAllContentLoaded();
  }

  public async waitForResource(filter: IWaitForResourceFilter, options?: IWaitForResourceOptions) {
    return Resource.waitFor(this.activeTab, filter, options);
  }

  public async waitForElement(element: ISuperElement, options?: IWaitForElementOptions) {
    return this.user.waitForElement(element, options);
  }

  public async waitForLocation(trigger: ILocationTrigger) {
    return this.user.waitForLocation(trigger);
  }

  public async waitForMillis(millis: number) {
    return this.user.waitForMillis(millis);
  }

  public async waitForWebSocket(url: string | RegExp) {
    return this.user.waitForWebSocket(url);
  }

  public async waitForNewTab() {
    return this.user.waitForNewTab();
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
  return new Browser(coreTab, sessionName);
}
