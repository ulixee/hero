import { assert } from '@secret-agent/commons/utils';
import IPuppetContext, {
  IPuppetContextEvents,
} from '@secret-agent/puppet/interfaces/IPuppetContext';
import IBrowserEmulation from '@secret-agent/puppet/interfaces/IBrowserEmulation';
import { ICookie } from '@secret-agent/core-interfaces/ICookie';
import { URL } from 'url';
import Protocol from 'devtools-protocol';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import { IBoundLog } from '@secret-agent/commons/Logger';
import { Page } from './Page';
import { Browser } from './Browser';
import { CDPSession } from './CDPSession';
import CookieParam = Protocol.Network.CookieParam;
import TargetInfo = Protocol.Target.TargetInfo;

export class BrowserContext extends TypedEventEmitter<IPuppetContextEvents>
  implements IPuppetContext {
  public emulation: IBrowserEmulation;
  public logger: IBoundLog;
  private readonly pages: Page[] = [];
  private readonly browser: Browser;
  private readonly id: string;
  private isClosing = false;

  constructor(
    browser: Browser,
    contextId: string,
    emulation: IBrowserEmulation,
    logger: IBoundLog,
  ) {
    super();
    this.browser = browser;
    this.id = contextId;
    this.emulation = emulation;
    this.logger = logger.createChild(module, {
      browserContextId: contextId,
    });
    this.browser.browserContextsById.set(this.id, this);
  }

  async newPage(): Promise<Page> {
    const { targetId } = await this.browser.cdpSession.send('Target.createTarget', {
      url: 'about:blank',
      browserContextId: this.id,
    });

    await this.attachToTarget(targetId);

    // NOTE: flow here interrupts and expects session to attach and call onPageAttached below
    const page = this.getPageWithId(targetId);
    await page.isReady;
    if (page.isClosed) throw new Error('Page has been closed.');
    return page;
  }

  targetDestroyed(targetId: string) {
    const page = this.getPageWithId(targetId);
    if (page) page.didClose();
  }

  async attachToTarget(targetId: string) {
    // chrome 80 still needs you to manually attach
    if (!this.getPageWithId(targetId)) {
      await this.browser.cdpSession.send('Target.attachToTarget', {
        targetId,
        flatten: true,
      });
    }
  }

  onPageAttached(cdpSession: CDPSession, targetInfo: TargetInfo) {
    if (this.getPageWithId(targetInfo.targetId)) return;

    let opener = targetInfo.openerId ? this.getPageWithId(targetInfo.openerId) || null : null;
    // make the first page the active page
    if (!opener && this.pages.length) opener = this.pages[0];
    const page = new Page(cdpSession, targetInfo.targetId, this, this.logger, opener);
    this.pages.push(page);
    // eslint-disable-next-line promise/catch-or-return
    page.isReady.then(() => this.emit('page', { page }));
  }

  onPageDetached(targetId: string) {
    const page = this.getPageWithId(targetId);
    if (page) {
      const idx = this.pages.indexOf(page);
      if (idx >= 0) this.pages.splice(idx, 1);
      page.didClose();
    }
  }

  async close(): Promise<void> {
    if (!this.browser.cdpSession.isConnected() || this.isClosing) return;
    assert(this.id, 'Non-incognito profiles cannot be closed!');
    this.isClosing = true;

    await Promise.all(this.pages.map(x => x.close()));

    await this.browser.cdpSession.send('Target.disposeBrowserContext', {
      browserContextId: this.id,
    });
    this.browser.browserContextsById.delete(this.id);
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

  private getPageWithId(targetId: string) {
    return this.pages.find(x => x.targetId === targetId);
  }
}
