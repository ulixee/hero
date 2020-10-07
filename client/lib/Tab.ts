import initializeConstantsAndProperties from 'awaited-dom/base/initializeConstantsAndProperties';
import StateMachine from 'awaited-dom/base/StateMachine';
import { ICookie } from '@secret-agent/core-interfaces/ICookie';
import { ISuperElement } from 'awaited-dom/base/interfaces/super';
import AwaitedPath from 'awaited-dom/base/AwaitedPath';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import SuperDocument from 'awaited-dom/impl/super-klasses/SuperDocument';
import { createResponse, createSuperDocument } from 'awaited-dom/impl/create';
import Request from 'awaited-dom/impl/official-klasses/Request';
import { ILocationTrigger, LocationStatus } from '@secret-agent/core-interfaces/Location';
import IWaitForResourceOptions from '@secret-agent/core-interfaces/IWaitForResourceOptions';
import IWaitForElementOptions from '@secret-agent/core-interfaces/IWaitForElementOptions';
import Browser from './Browser';
import CoreTab from './CoreTab';
import Resource, { createResource } from './Resource';
import IWaitForResourceFilter from '../interfaces/IWaitForResourceFilter';
import WebsocketResource from './WebsocketResource';
import IAwaitedOptions from '../interfaces/IAwaitedOptions';
import RequestGenerator, { getRequestIdOrUrl } from './Request';
import AwaitedEventTarget from './AwaitedEventTarget';

const { getState, setState } = StateMachine<Tab, IState>();
const browserState = StateMachine<Browser, { activeTab: Tab; tabs: Tab[] }>();
const awaitedPathState = StateMachine<any, { awaitedPath: AwaitedPath }>();

export interface IState {
  browser: Browser;
  coreTab: CoreTab;
}

interface IEventType {
  resource: Resource | WebsocketResource;
}

const propertyKeys: (keyof Tab)[] = [
  'lastCommandId',
  'tabId',
  'url',
  'cookies',
  'document',
  'Request',
];

export default class Tab extends AwaitedEventTarget<IEventType, IState> {
  constructor(browser: Browser, coreTab: CoreTab) {
    super();
    initializeConstantsAndProperties(this, [], propertyKeys);
    setState(this, {
      browser,
      coreTab,
    });
  }

  public get tabId(): string {
    return getCoreTab(this).tabId;
  }

  public get lastCommandId(): number {
    return getCoreTab(this).commandQueue.lastCommandId;
  }

  public get url(): Promise<string> {
    return getCoreTab(this).getUrl();
  }

  public get cookies(): Promise<ICookie[]> {
    return getCoreTab(this).getPageCookies();
  }

  public get document(): SuperDocument {
    const awaitedPath = new AwaitedPath('document');
    const awaitedOptions = { ...getState(this) };
    return createSuperDocument<IAwaitedOptions>(awaitedPath, awaitedOptions) as SuperDocument;
  }

  public get Request(): typeof Request {
    return RequestGenerator(getCoreTab(this));
  }

  // METHODS

  public async goto(href: string) {
    const coreTab = getCoreTab(this);
    const resource = await coreTab.goto(href);
    return createResource(resource, coreTab);
  }

  public async goBack() {
    const coreTab = getCoreTab(this);
    return coreTab.goBack();
  }

  public async goForward() {
    const coreTab = getCoreTab(this);
    return coreTab.goForward();
  }

  public async getJsValue<T>(path: string) {
    return getCoreTab(this).getJsValue<T>(path);
  }

  public async fetch(request: Request | string, init?: IRequestInit) {
    const requestInput = await getRequestIdOrUrl(request);
    const attachedState = await getCoreTab(this).fetch(requestInput, init);

    const awaitedPath = new AwaitedPath().withAttachedId(attachedState.id);
    return createResponse(awaitedPath, { ...getState(this) });
  }

  public async waitForAllContentLoaded(): Promise<void> {
    await getCoreTab(this).waitForLoad(LocationStatus.AllContentLoaded);
  }

  public async waitForLoad(status: LocationStatus): Promise<void> {
    await getCoreTab(this).waitForLoad(status);
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
    await getCoreTab(this).waitForElement(awaitedPath.toJSON(), options);
  }

  public async waitForLocation(trigger: ILocationTrigger): Promise<void> {
    await getCoreTab(this).waitForLocation(trigger);
  }

  public async waitForMillis(millis: number): Promise<void> {
    await getCoreTab(this).waitForMillis(millis);
  }

  public async waitForWebSocket(url: string | RegExp): Promise<void> {
    await getCoreTab(this).waitForWebSocket(url);
  }

  public async focus() {
    const { browser, coreTab } = getState(this);
    browserState.setState(browser, {
      activeTab: this,
    });
    return coreTab.focusTab();
  }

  public async close() {
    const { browser, coreTab } = getState(this);
    const { tabs } = browserState.getState(browser);
    const updatedTabs = tabs.filter(x => x !== this);
    if (updatedTabs.length) {
      browserState.setState(browser, {
        activeTab: updatedTabs[0],
        tabs: updatedTabs,
      });
    }
    return coreTab.close();
  }
}

export function getCoreTab(tab: Tab): CoreTab {
  return getState(tab).coreTab;
}

// CREATE

export function createTab(browser: Browser, coreTab: CoreTab): Tab {
  return new Tab(browser, coreTab);
}
