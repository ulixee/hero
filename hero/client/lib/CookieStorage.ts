import StateMachine from 'awaited-dom/base/StateMachine';
import ISetCookieOptions from '@secret-agent/interfaces/ISetCookieOptions';
import { ICookie } from '@secret-agent/interfaces/ICookie';
import CoreFrameEnvironment from './CoreFrameEnvironment';

const { getState, setState } = StateMachine<CookieStorage, IState>();

interface IState {
  coreFrame: Promise<CoreFrameEnvironment>;
}

export default class CookieStorage {
  public get length(): Promise<number> {
    return this.getItems().then(x => x.length);
  }

  public async getItems(): Promise<ICookie[]> {
    const coreFrame = await getCoreFrame(this);
    return await coreFrame.getCookies();
  }

  public async key(index: number): Promise<string> {
    const cookies = await this.getItems();
    return Object.keys(cookies)[index];
  }

  public async clear(): Promise<void> {
    const coreFrame = await getCoreFrame(this);
    const cookies = await this.getItems();
    for (const cookie of cookies) {
      await coreFrame.removeCookie(cookie.name);
    }
  }

  public async getItem(key: string): Promise<ICookie> {
    const cookies = await this.getItems();
    return cookies.find(x => x.name === key);
  }

  public async setItem(key: string, value: string, options?: ISetCookieOptions): Promise<boolean> {
    const coreFrame = await getCoreFrame(this);
    return coreFrame.setCookie(key, value, options);
  }

  public async removeItem(name: string): Promise<boolean> {
    const coreFrame = await getCoreFrame(this);
    return coreFrame.removeCookie(name);
  }
}

function getCoreFrame(cookieStorage: CookieStorage): Promise<CoreFrameEnvironment> {
  return getState(cookieStorage).coreFrame;
}

export function createCookieStorage(coreFrame: Promise<CoreFrameEnvironment>): CookieStorage {
  const cookieStorage = new CookieStorage();
  setState(cookieStorage, { coreFrame });
  return cookieStorage;
}
