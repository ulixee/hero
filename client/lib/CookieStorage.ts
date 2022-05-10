import ISetCookieOptions from '@ulixee/hero-interfaces/ISetCookieOptions';
import { ICookie } from '@unblocked-web/emulator-spec/net/ICookie';
import CoreFrameEnvironment from './CoreFrameEnvironment';

export default class CookieStorage {
  #coreFrame: Promise<CoreFrameEnvironment>;

  constructor(coreFrame: Promise<CoreFrameEnvironment>) {
    this.#coreFrame = coreFrame;
  }

  public get length(): Promise<number> {
    return this.getItems().then(x => x.length);
  }

  public async getItems(): Promise<ICookie[]> {
    const coreFrame = await this.#coreFrame;
    return await coreFrame.getCookies();
  }

  public async key(index: number): Promise<string> {
    const cookies = await this.getItems();
    return Object.keys(cookies)[index];
  }

  public async clear(): Promise<void> {
    const coreFrame = await this.#coreFrame;
    const cookies = await this.getItems();
    for (const cookie of cookies) {
      await coreFrame.removeCookie(cookie.name);
    }
  }

  public async getItem(key: string): Promise<ICookie> {
    const cookies = await this.getItems();
    return cookies?.find(x => x.name === key);
  }

  public async setItem(key: string, value: string, options?: ISetCookieOptions): Promise<boolean> {
    const coreFrame = await this.#coreFrame;
    return coreFrame.setCookie(key, value, options);
  }

  public async removeItem(name: string): Promise<boolean> {
    const coreFrame = await this.#coreFrame;
    return coreFrame.removeCookie(name);
  }
}

export function createCookieStorage(coreFrame: Promise<CoreFrameEnvironment>): CookieStorage {
  return new CookieStorage(coreFrame);
}
