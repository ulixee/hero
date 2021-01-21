import initializeConstantsAndProperties from 'awaited-dom/base/initializeConstantsAndProperties';
import StateMachine from 'awaited-dom/base/StateMachine';
import { ISuperElement } from 'awaited-dom/base/interfaces/super';
import AwaitedPath from 'awaited-dom/base/AwaitedPath';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import SuperDocument from 'awaited-dom/impl/super-klasses/SuperDocument';
import Storage from 'awaited-dom/impl/official-klasses/Storage';
import CSSStyleDeclaration from 'awaited-dom/impl/official-klasses/CSSStyleDeclaration';
import {
  createCSSStyleDeclaration,
  createResponse,
  createStorage,
  createSuperDocument,
} from 'awaited-dom/impl/create';
import Request from 'awaited-dom/impl/official-klasses/Request';
import { ILocationTrigger, LocationStatus } from '@secret-agent/core-interfaces/Location';
import IWaitForResourceOptions from '@secret-agent/core-interfaces/IWaitForResourceOptions';
import IWaitForElementOptions from '@secret-agent/core-interfaces/IWaitForElementOptions';
import Response from 'awaited-dom/impl/official-klasses/Response';
import IWaitForOptions from '@secret-agent/core-interfaces/IWaitForOptions';
import { IElementIsolate } from 'awaited-dom/base/interfaces/isolate';
import CoreTab from './CoreTab';
import Resource, { createResource } from './Resource';
import IWaitForResourceFilter from '../interfaces/IWaitForResourceFilter';
import WebsocketResource from './WebsocketResource';
import IAwaitedOptions from '../interfaces/IAwaitedOptions';
import RequestGenerator, { getRequestIdOrUrl } from './Request';
import AwaitedEventTarget from './AwaitedEventTarget';
import CookieStorage, { createCookieStorage } from './CookieStorage';
import Agent, { IState as IAgentState } from './Agent';
import { getAwaitedPathAsMethodArg } from './SetupAwaitedHandler';

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

  public getComputedStyle(element: IElementIsolate, pseudoElement?: string): CSSStyleDeclaration {
    const { awaitedPath: elementAwaitedPath } = awaitedPathState.getState(element);
    const awaitedPath = new AwaitedPath('window', [
      'getComputedStyle',
      getAwaitedPathAsMethodArg(elementAwaitedPath),
      pseudoElement,
    ]);
    const awaitedOptions = { ...getState(this) };
    return createCSSStyleDeclaration<IAwaitedOptions>(
      awaitedPath,
      awaitedOptions,
    ) as CSSStyleDeclaration;
  }

  public async goto(href: string, timeoutMs?: number): Promise<Resource> {
    const coreTab = await getCoreTab(this);
    const resource = await coreTab.goto(href, timeoutMs);
    return createResource(resource, Promise.resolve(coreTab));
  }

  public async goBack(timeoutMs?: number): Promise<string> {
    const coreTab = await getCoreTab(this);
    return coreTab.goBack(timeoutMs);
  }

  public async goForward(timeoutMs?: number): Promise<string> {
    const coreTab = await getCoreTab(this);
    return coreTab.goForward(timeoutMs);
  }

  public async reload(timeoutMs?: number): Promise<void> {
    const coreTab = await getCoreTab(this);
    return coreTab.reload(timeoutMs);
  }

  public async getJsValue<T>(path: string): Promise<{ value: T; type: string }> {
    const coreTab = await getCoreTab(this);
    return coreTab.getJsValue<T>(path);
  }

  public async isElementVisible(element: IElementIsolate): Promise<boolean> {
    const { awaitedPath } = awaitedPathState.getState(element);
    const coreTab = await getCoreTab(this);
    return coreTab.isElementVisible(awaitedPath.toJSON());
  }

  public async waitForPaintingStable(options?: IWaitForOptions): Promise<void> {
    const coreTab = await getCoreTab(this);
    await coreTab.waitForLoad(LocationStatus.PaintingStable, options);
  }

  public async waitForLoad(status: LocationStatus, options?: IWaitForOptions): Promise<void> {
    const coreTab = await getCoreTab(this);
    await coreTab.waitForLoad(status, options);
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

  public async waitForLocation(
    trigger: ILocationTrigger,
    options?: IWaitForOptions,
  ): Promise<void> {
    const coreTab = await getCoreTab(this);
    await coreTab.waitForLocation(trigger, options);
  }

  public async waitForMillis(millis: number): Promise<void> {
    const coreTab = await getCoreTab(this);
    await coreTab.waitForMillis(millis);
  }

  public focus(): Promise<void> {
    const { secretAgent, coreTab } = getState(this);
    agentState.getState(secretAgent).connection.activeTab = this;
    return coreTab.then(x => x.focusTab());
  }

  public close(): Promise<void> {
    const { secretAgent, coreTab } = getState(this);
    const { connection } = agentState.getState(secretAgent);
    connection.closeTab(this);
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
