import { EventEmitter } from 'events';
import { assert } from '@secret-agent/commons/utils';
import IPuppetContext from '@secret-agent/puppet/interfaces/IPuppetContext';
import IBrowserEmulation from '@secret-agent/puppet/interfaces/IBrowserEmulation';
import { ICookie } from '@secret-agent/core-interfaces/ICookie';
import { URL } from 'url';
import Protocol from 'devtools-protocol';
import { Page } from './Page';
import { Browser } from './Browser';
import CookieParam = Protocol.Network.CookieParam;

export class BrowserContext extends EventEmitter implements IPuppetContext {
  public emulation: IBrowserEmulation;
  private readonly browser: Browser;
  private readonly id: string;
  private isClosing = false;

  constructor(browser: Browser, contextId: string, emulation: IBrowserEmulation) {
    super();
    this.browser = browser;
    this.id = contextId;
    this.emulation = emulation;
    this.browser.browserContextsById.set(this.id, this);
  }

  public async newPage(): Promise<Page> {
    const { targetId } = await this.browser.cdpSession.send('Target.createTarget', {
      url: 'about:blank',
      browserContextId: this.id,
    });
    // chrome 80 still needs you to manually attach
    if (!this.browser.pagesById.has(targetId)) {
      await this.browser.cdpSession.send('Target.attachToTarget', {
        targetId,
        flatten: true,
      });
    }

    const page = this.browser.pagesById.get(targetId);
    await page.isReady;
    if (page.isClosed) throw new Error('Page has been closed.');
    return page;
  }

  async getCookies(url?: URL): Promise<ICookie[]> {
    const { cookies } = await this.browser.cdpSession.send('Storage.getCookies', {
      browserContextId: this.id,
    });
    return cookies
      .map(c => {
        const copy: any = { sameSite: 'None', ...c };
        delete copy.size;
        delete copy.priority;
        delete copy.session;

        copy.expires = String(copy.expires);
        return copy as ICookie;
      })
      .filter(c => {
        if (!url) return true;

        if (url.hostname !== c.domain) return false;
        if (!url.pathname.startsWith(c.path)) return false;
        if ((url.protocol === 'https:') !== c.secure) return false;
        return true;
      });
  }

  async addCookies(cookies: ICookie[], origins?: string[]) {
    const originUrls = (origins ?? []).map(x => new URL(x));
    const parsedCookies: CookieParam[] = [];
    for (const cookie of cookies) {
      assert(cookie.name, 'Cookie should have a name');
      assert(cookie.value, 'Cookie should have a value');
      assert(cookie.domain || cookie.url, 'Cookie should have a domain or url');
      const cookieToSend: CookieParam = {
        ...cookie,
        expires: cookie.expires ? parseInt(cookie.expires, 10) : -1,
      };

      if (!cookieToSend.url) {
        cookieToSend.url = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
        const match = originUrls.find(x => {
          return x.hostname.endsWith(cookie.domain);
        });
        if (match) cookieToSend.url = match.href;
      }

      // chrome won't allow same site not for non-secure cookies
      if (!cookie.secure && cookie.sameSite === 'None') {
        delete cookieToSend.sameSite;
      }

      parsedCookies.push(cookieToSend);
    }
    await this.browser.cdpSession.send('Storage.setCookies', {
      cookies: parsedCookies,
      browserContextId: this.id,
    });
  }

  public async close(): Promise<void> {
    if (!this.browser.cdpSession.isConnected() || this.isClosing) return;
    assert(this.id, 'Non-incognito profiles cannot be closed!');
    this.isClosing = true;

    await this.browser.cdpSession.send('Target.disposeBrowserContext', {
      browserContextId: this.id,
    });
    this.browser.browserContextsById.delete(this.id);
  }
}
