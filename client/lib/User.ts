import initializeConstantsAndProperties from 'awaited-dom/base/initializeConstantsAndProperties';
import StateMachine from 'awaited-dom/base/StateMachine';
import { ICookie } from '@secret-agent/core-interfaces/ICookie';
import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';
import IDomStorage from '@secret-agent/core-interfaces/IDomStorage';
import Browser from './Browser';
import IInteractions, { IMousePosition, ITypeInteraction } from '../interfaces/IInteractions';
import Interactor from './Interactor';
import Tab, { getCoreTab } from './Tab';

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

  public async exportProfile(): Promise<IUserProfile> {
    return await getActiveTabSession(this).exportUserProfile();
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
  return getCoreTab(browser.activeTab);
}
