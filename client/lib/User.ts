import initializeConstantsAndProperties from 'awaited-dom/base/initializeConstantsAndProperties';
import StateMachine from 'awaited-dom/base/StateMachine';
import { ILocationTrigger, LocationStatus } from '@secret-agent/core-interfaces/Location';
import AwaitedPath from 'awaited-dom/base/AwaitedPath';
import { ISuperElement } from 'awaited-dom/base/interfaces/super';
import { ICookie } from '@secret-agent/core-interfaces/ICookie';
import IWaitForElementOptions from '@secret-agent/core-interfaces/IWaitForElementOptions';
import IWaitForResourceOptions from '@secret-agent/core-interfaces/IWaitForResourceOptions';
import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';
import IDomStorage from '@secret-agent/core-interfaces/IDomStorage';
import WebsocketResource from './WebsocketResource';
import Browser from './Browser';
import Resource, { createResource } from './Resource';
import IInteractions, { IMousePosition, ITypeInteraction } from '../interfaces/IInteractions';
import Interactor from './Interactor';
import IWaitForResourceFilter from '../interfaces/IWaitForResourceFilter';
import Tab, { createTab, getTabSession } from './Tab';
import CoreTab from './CoreTab';

const { getState, setState } = StateMachine<User, IState>();

interface IState {
  browser: Browser;
}

const propertyKeys: (keyof User)[] = ['cookies', 'storage', 'lastCommandId'];

export default class User {
  constructor(browser: Browser) {
    initializeConstantsAndProperties(this, [], propertyKeys);
    setState(this, {
      browser,
    });
  }

  public get cookies(): Promise<ICookie[]> {
    return getActiveTabSession(this).getAllCookies();
  }

  public get storage(): Promise<IDomStorage> {
    const activeTab = getActiveTabSession(this);
    return activeTab.exportUserProfile().then(x => x.storage);
  }

  public get lastCommandId(): number {
    return getState(this).browser.lastCommandId;
  }

  // METHODS

  public async goto(href: string) {
    const activeTab = getActiveTabSession(this);
    const resource = await activeTab.goto(href);
    return createResource(resource, activeTab);
  }

  public async click(mousePosition: IMousePosition) {
    const activeTab = getActiveTabSession(this);
    await Interactor.run(activeTab, [{ click: mousePosition }]);
  }

  public async interact(...interactions: IInteractions) {
    const activeTab = getActiveTabSession(this);
    await Interactor.run(activeTab, interactions);
  }

  public async type(...typeInteractions: ITypeInteraction[]) {
    const activeTab = getActiveTabSession(this);
    await Interactor.run(
      activeTab,
      typeInteractions.map(t => ({ type: t })),
    );
  }

  public async waitForAllContentLoaded(): Promise<void> {
    await getActiveTabSession(this).waitForLoad(LocationStatus.AllContentLoaded);
  }

  public async waitForLoad(status: LocationStatus): Promise<void> {
    await getActiveTabSession(this).waitForLoad(status);
  }

  public async waitForResource(
    filter: IWaitForResourceFilter,
    options?: IWaitForResourceOptions,
  ): Promise<(Resource | WebsocketResource)[]> {
    const browser = getState(this).browser;
    return Resource.waitFor(browser.activeTab, filter, options);
  }

  public async waitForElement(
    element: ISuperElement,
    options?: IWaitForElementOptions,
  ): Promise<void> {
    const { awaitedPath } = getState<ISuperElement, { awaitedPath: AwaitedPath }>(element);
    await getActiveTabSession(this).waitForElement(awaitedPath.toJSON(), options);
  }

  public async waitForLocation(trigger: ILocationTrigger): Promise<void> {
    await getActiveTabSession(this).waitForLocation(trigger);
  }

  public async waitForMillis(millis: number): Promise<void> {
    await getActiveTabSession(this).waitForMillis(millis);
  }

  public async waitForWebSocket(url: string | RegExp): Promise<void> {
    await getActiveTabSession(this).waitForWebSocket(url);
  }

  public async exportProfile(): Promise<IUserProfile> {
    return await getActiveTabSession(this).exportUserProfile();
  }

  public async waitForNewTab(): Promise<Tab> {
    const browser = getState(this).browser;
    const coreClient = getTabSession(browser.activeTab);
    const coreTab = await coreClient.waitForNewTab();
    return createTab(browser, coreTab);
  }

  public async focusTab(tab: Tab) {
    return await tab.focus();
  }
}

// CREATE

export function createUser(browser: Browser): User {
  return new User(browser);
}

function getActiveTabSession(user: User) {
  const browser = getState(user).browser;
  return getTabSession(browser.activeTab);
}
