import initializeConstantsAndProperties from 'awaited-dom/base/initializeConstantsAndProperties';
import StateMachine from 'awaited-dom/base/StateMachine';
import ISetCookieOptions from '@secret-agent/core-interfaces/ISetCookieOptions';
import { ICookie } from '@secret-agent/core-interfaces/ICookie';
import CoreSession from './CoreTab';

const { getState, setState } = StateMachine<CookieStorage, IState>();

interface IState {
  coreTab: Promise<CoreSession>;
}

export default class CookieStorage {
  constructor() {
    initializeConstantsAndProperties(this, [], []);
  }

  public get length(): Promise<number> {
    return this.getItems().then(x => x.length);
  }

  public async getItems(): Promise<ICookie[]> {
    const coreTab = await getState(this).coreTab;
    return await coreTab.getCookies();
  }

  public async key(index: number): Promise<string> {
    const cookies = await this.getItems();
    return Object.keys(cookies)[index];
  }

  public async clear(): Promise<void> {
    const coreTab = await getState(this).coreTab;
    const cookies = await this.getItems();
    for (const cookie of cookies) {
      await coreTab.removeCookie(cookie.name);
    }
  }

  public async getItem(key: string): Promise<ICookie> {
    const cookies = await this.getItems();
    return cookies.find(x => x.name === key);
  }

  public async setItem(key: string, value: string, options?: ISetCookieOptions): Promise<boolean> {
    const coreTab = await getState(this).coreTab;
    return coreTab.setCookie(key, value, options);
  }

  public async removeItem(name: string): Promise<boolean> {
    const coreTab = await getState(this).coreTab;
    return coreTab.removeCookie(name);
  }
}

export function createCookieStorage(coreTab: Promise<CoreSession>): CookieStorage {
  const cookieStorage = new CookieStorage();
  setState(cookieStorage, { coreTab });
  return cookieStorage;
}
