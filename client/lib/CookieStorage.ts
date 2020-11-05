import initializeConstantsAndProperties from 'awaited-dom/base/initializeConstantsAndProperties';
import StateMachine from 'awaited-dom/base/StateMachine';
import ISetCookieOptions from '@secret-agent/core-interfaces/ISetCookieOptions';
import CoreTab from './CoreTab';

const { getState, setState } = StateMachine<CookieStorage, IState>();

interface IState {
  coreTab: Promise<CoreTab>;
}

export default class CookieStorage {
  constructor() {
    initializeConstantsAndProperties(this, [], []);
  }

  public get length() {
    return this.getItems().then(x => x.length);
  }

  public async getItems() {
    const coreTab = await getState(this).coreTab;
    return await coreTab.getCookies();
  }

  public async key(index: number) {
    const cookies = await this.getItems();
    return Object.keys(cookies)[index];
  }

  public async clear() {
    const coreTab = await getState(this).coreTab;
    const cookies = await this.getItems();
    for (const cookie of cookies) {
      await coreTab.removeCookie(cookie.name);
    }
  }

  public async getItem(key: string) {
    const cookies = await this.getItems();
    return cookies.find(x => x.name === key);
  }

  public async setItem(key: string, value: string, options?: ISetCookieOptions) {
    const coreTab = await getState(this).coreTab;
    return coreTab.setCookie(key, value, options);
  }

  public async removeItem(name: string) {
    const coreTab = await getState(this).coreTab;
    return coreTab.removeCookie(name);
  }
}

export function createCookieStorage(coreTab: Promise<CoreTab>) {
  const cookieStorage = new CookieStorage();
  setState(cookieStorage, { coreTab });
  return cookieStorage;
}
