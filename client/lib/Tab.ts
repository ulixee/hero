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
import Response from 'awaited-dom/impl/official-klasses/Response';
import CoreTab from './CoreTab';
import Resource, { createResource } from './Resource';
import IWaitForResourceFilter from '../interfaces/IWaitForResourceFilter';
import WebsocketResource from './WebsocketResource';
import IAwaitedOptions from '../interfaces/IAwaitedOptions';
import RequestGenerator, { getRequestIdOrUrl } from './Request';
import AwaitedEventTarget from './AwaitedEventTarget';
import CookieStorage, { createCookieStorage } from './CookieStorage';
import Agent, { IState as IAgentState } from './Agent';

const { getState, setState } = StateMachine<Tab, IState>();
const agentState = StateMachine<Agent, IAgentState>();
const awaitedPathState = StateMachine<any, { awaitedPath: AwaitedPath }>();

export interface IState {
  secretAgent: Agent;
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

export default class Tab extends AwaitedEventTarget<IEventType> {
  constructor(secretAgent: Agent, coreTab: Promise<CoreTab>) {
    super(() => {
      return { target: coreTab };
    });
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

  public async fetch(request: Request | string, init?: IRequestInit): Promise<Response> {
    const requestInput = await getRequestIdOrUrl(request);
    const coreTab = await getCoreTab(this);
    const attachedState = await coreTab.fetch(requestInput, init);

    const awaitedPath = new AwaitedPath().withAttachedId(attachedState.id);
    return createResponse(awaitedPath, { ...getState(this) });
  }

  public async goto(href: string): Promise<Resource> {
    const coreTab = await getCoreTab(this);
    const resource = await coreTab.goto(href);
    return createResource(resource, Promise.resolve(coreTab));
  }

  public async goBack(): Promise<string> {
    const coreTab = await getCoreTab(this);
    return coreTab.goBack();
  }

  public async goForward(): Promise<string> {
    const coreTab = await getCoreTab(this);
    return coreTab.goForward();
  }

  public async getJsValue<T>(path: string): Promise<{ value: T; type: string }> {
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

  public waitForResource(
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

  public focus(): Promise<void> {
    const { secretAgent, coreTab } = getState(this);
    agentState.getState(secretAgent).connection.activeTab = this;
    return coreTab.then(x => x.focusTab());
  }

  public close(): Promise<void> {
    const { secretAgent, coreTab } = getState(this);
    const { connection } = agentState.getState(secretAgent);
    const tabIdx = connection.tabs.indexOf(this);
    connection.tabs.splice(tabIdx, 1);
    if (connection.tabs.length) {
      connection.activeTab = connection.tabs[0];
    }
    return coreTab.then(x => x.close());
  }
}

export function getCoreTab(tab: Tab): Promise<CoreTab> {
  return getState(tab).coreTab;
}

// CREATE

export function createTab(secretAgent: Agent, coreTab: Promise<CoreTab>): Tab {
  return new Tab(secretAgent, coreTab);
}
