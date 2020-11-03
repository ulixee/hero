import initializeConstantsAndProperties from 'awaited-dom/base/initializeConstantsAndProperties';
import StateMachine from 'awaited-dom/base/StateMachine';
import { ISuperElement } from 'awaited-dom/base/interfaces/super';
import AwaitedPath from 'awaited-dom/base/AwaitedPath';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import SuperDocument from 'awaited-dom/impl/super-klasses/SuperDocument';
import Storage from 'awaited-dom/impl/official-klasses/Storage';
import { createResponse, createStorage, createSuperDocument } from 'awaited-dom/impl/create';
import Request from 'awaited-dom/impl/official-klasses/Request';
import { ILocationTrigger, LocationStatus } from '@secret-agent/core-interfaces/Location';
import IWaitForResourceOptions from '@secret-agent/core-interfaces/IWaitForResourceOptions';
import IWaitForElementOptions from '@secret-agent/core-interfaces/IWaitForElementOptions';
import CoreTab from './CoreTab';
import Resource, { createResource } from './Resource';
import IWaitForResourceFilter from '../interfaces/IWaitForResourceFilter';
import WebsocketResource from './WebsocketResource';
import IAwaitedOptions from '../interfaces/IAwaitedOptions';
import RequestGenerator, { getRequestIdOrUrl } from './Request';
import AwaitedEventTarget from './AwaitedEventTarget';
import ISecretAgent from '../interfaces/ISecretAgent';
import CookieStorage, { createCookieStorage } from './CookieStorage';

const { getState, setState } = StateMachine<Tab, IState>();
const agentState = StateMachine<ISecretAgent, { activeTab: Tab; tabs: Tab[] }>();
const awaitedPathState = StateMachine<any, { awaitedPath: AwaitedPath }>();

export interface IState {
  secretAgent: ISecretAgent;
  coreTab: Promise<CoreTab>;
}

interface IEventType {
  resource: Resource | WebsocketResource;
}

const propertyKeys: (keyof Tab)[] = [
  'lastCommandId',
  'tabId',
  'url',
  'cookieStorage',
  'localStorage',
  'sessionStorage',
  'document',
  'Request',
];

export default class Tab extends AwaitedEventTarget<IEventType, IState> {
  constructor(secretAgent: ISecretAgent, coreTab: Promise<CoreTab>) {
    super();
    initializeConstantsAndProperties(this, [], propertyKeys);
    setState(this, {
      secretAgent,
      coreTab,
    });
  }

  public get tabId(): Promise<string> {
    return getCoreTab(this).then(x => x.tabId);
  }

  public get lastCommandId(): Promise<number> {
    return getCoreTab(this).then(x => x.commandQueue.lastCommandId);
  }

  public get url(): Promise<string> {
    return getCoreTab(this).then(x => x.getUrl());
  }

  public get cookieStorage(): CookieStorage {
    return createCookieStorage(getCoreTab(this));
  }

  public get document(): SuperDocument {
    const awaitedPath = new AwaitedPath('document');
    const awaitedOptions = { ...getState(this) };
    return createSuperDocument<IAwaitedOptions>(awaitedPath, awaitedOptions) as SuperDocument;
  }

  public get localStorage(): Storage {
    const awaitedPath = new AwaitedPath('localStorage');
    const awaitedOptions = { ...getState(this) };
    return createStorage<IAwaitedOptions>(awaitedPath, awaitedOptions) as Storage;
  }

  public get sessionStorage(): Storage {
    const awaitedPath = new AwaitedPath('sessionStorage');
    const awaitedOptions = { ...getState(this) };
    return createStorage<IAwaitedOptions>(awaitedPath, awaitedOptions) as Storage;
  }

  public get Request(): typeof Request {
    return RequestGenerator(getCoreTab(this));
  }

  // METHODS

  public async fetch(request: Request | string, init?: IRequestInit) {
    const requestInput = await getRequestIdOrUrl(request);
    const coreTab = await getCoreTab(this);
    const attachedState = await coreTab.fetch(requestInput, init);

    const awaitedPath = new AwaitedPath().withAttachedId(attachedState.id);
    return createResponse(awaitedPath, { ...getState(this) });
  }

  public async goto(href: string) {
    const coreTab = await getCoreTab(this);
    const resource = await coreTab.goto(href);
    return createResource(resource, Promise.resolve(coreTab));
  }

  public async goBack() {
    const coreTab = await getCoreTab(this);
    return coreTab.goBack();
  }

  public async goForward() {
    const coreTab = await getCoreTab(this);
    return coreTab.goForward();
  }

  public async getJsValue<T>(path: string) {
    const coreTab = await getCoreTab(this);
    return coreTab.getJsValue<T>(path);
  }

  public async isElementVisible(element: ISuperElement): Promise<boolean> {
    const { awaitedPath } = awaitedPathState.getState(element);
    const coreTab = await getCoreTab(this);
    return coreTab.isElementVisible(awaitedPath.toJSON());
  }

  public async waitForAllContentLoaded(): Promise<void> {
    const coreTab = await getCoreTab(this);
    await coreTab.waitForLoad(LocationStatus.AllContentLoaded);
  }

  public async waitForLoad(status: LocationStatus): Promise<void> {
    const coreTab = await getCoreTab(this);
    await coreTab.waitForLoad(status);
  }

  public async waitForResource(
    filter: IWaitForResourceFilter,
    options?: IWaitForResourceOptions,
  ): Promise<(Resource | WebsocketResource)[]> {
    return Resource.waitFor(this, filter, options);
  }

  public async waitForElement(
    element: ISuperElement,
    options?: IWaitForElementOptions,
  ): Promise<void> {
    const { awaitedPath } = awaitedPathState.getState(element);
    const coreTab = await getCoreTab(this);
    await coreTab.waitForElement(awaitedPath.toJSON(), options);
  }

  public async waitForLocation(trigger: ILocationTrigger): Promise<void> {
    const coreTab = await getCoreTab(this);
    await coreTab.waitForLocation(trigger);
  }

  public async waitForMillis(millis: number): Promise<void> {
    const coreTab = await getCoreTab(this);
    await coreTab.waitForMillis(millis);
  }

  public async waitForWebSocket(url: string | RegExp): Promise<void> {
    const coreTab = await getCoreTab(this);
    await coreTab.waitForWebSocket(url);
  }

  public async focus() {
    const { secretAgent, coreTab } = getState(this);
    agentState.setState(secretAgent, {
      activeTab: this,
    });
    return coreTab.then(x => x.focusTab());
  }

  public async close() {
    const { secretAgent, coreTab } = getState(this);
    const { tabs } = agentState.getState(secretAgent);
    const updatedTabs = tabs.filter(x => x !== this);
    if (updatedTabs.length) {
      agentState.setState(secretAgent, {
        activeTab: updatedTabs[0],
        tabs: updatedTabs,
      });
    }
    return coreTab.then(x => x.close());
  }
}

export function getCoreTab(tab: Tab): Promise<CoreTab> {
  return getState(tab).coreTab;
}

// CREATE

export function createTab(secretAgent: ISecretAgent, coreTab: Promise<CoreTab>): Tab {
  return new Tab(secretAgent, coreTab);
}
