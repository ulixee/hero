import { assert } from '@secret-agent/commons/utils';
import IPuppetContext, {
  IPuppetContextEvents,
} from '@secret-agent/puppet-interfaces/IPuppetContext';
import IBrowserEmulationSettings from '@secret-agent/puppet-interfaces/IBrowserEmulationSettings';
import { ICookie } from '@secret-agent/core-interfaces/ICookie';
import { URL } from 'url';
import Protocol from 'devtools-protocol';
import {
  addTypedEventListener,
  removeEventListeners,
  TypedEventEmitter,
} from '@secret-agent/commons/eventUtils';
import { IBoundLog } from '@secret-agent/core-interfaces/ILog';
import { ProtocolMapping } from 'devtools-protocol/types/protocol-mapping';
import IRegisteredEventListener from '@secret-agent/core-interfaces/IRegisteredEventListener';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import { Page } from './Page';
import { Browser } from './Browser';
import { CDPSession } from './CDPSession';
import Frame from './Frame';
import CookieParam = Protocol.Network.CookieParam;
import TargetInfo = Protocol.Target.TargetInfo;

export class BrowserContext
  extends TypedEventEmitter<IPuppetContextEvents>
  implements IPuppetContext {
  public logger: IBoundLog;
  public get emulation(): IBrowserEmulationSettings {
    return this._emulation;
  }

  public set emulation(value: IBrowserEmulationSettings) {
    this._emulation = value;
    for (const page of this.pages) {
      page.updateEmulationSettings().catch(err => {
        this.logger.error('ERROR setting emulation settings', err);
      });
    }
  }

  private _emulation: IBrowserEmulationSettings;

  private readonly pages: Page[] = [];
  private readonly browser: Browser;
  private readonly id: string;
  private isClosing = false;

  private cdpSessions = new WeakSet<CDPSession>();

  private eventListeners: IRegisteredEventListener[] = [];
  private browserContextInitiatedMessageIds = new Set<number>();

  constructor(
    browser: Browser,
    contextId: string,
    emulation: IBrowserEmulationSettings,
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

    this.subscribeToDevtoolsMessages(this.browser.cdpSession, {
      sessionType: 'browser',
    });
  }

  async newPage(): Promise<Page> {
    const { targetId } = await this.cdpRootSessionSend('Target.createTarget', {
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
      await this.cdpRootSessionSend('Target.attachToTarget', {
        targetId,
        flatten: true,
      });
    }
  }

  onPageAttached(cdpSession: CDPSession, targetInfo: TargetInfo) {
    if (this.getPageWithId(targetInfo.targetId)) return;

    this.subscribeToDevtoolsMessages(cdpSession, {
      sessionType: 'page',
      pageTargetId: targetInfo.targetId,
    });

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

  onWorkerAttached(cdpSession: CDPSession, workerTargetId: string, pageTargetId: string) {
    this.subscribeToDevtoolsMessages(cdpSession, {
      sessionType: 'worker' as const,
      pageTargetId,
      workerTargetId,
    });
  }

  async close(): Promise<void> {
    if (this.isClosing) return;
    this.isClosing = true;

    await Promise.all(this.pages.map(x => x.close()));
    await this.cdpRootSessionSend('Target.disposeBrowserContext', {
      browserContextId: this.id,
    }).catch(err => {
      if (err instanceof CanceledPromiseError) return;
      throw err;
    });
    removeEventListeners(this.eventListeners);
    this.browser.browserContextsById.delete(this.id);
  }

  async getCookies(url?: URL): Promise<ICookie[]> {
    const { cookies } = await this.cdpRootSessionSend('Storage.getCookies', {
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
        if (c.secure === true && url.protocol !== 'https:') return false;
        return true;
      });
  }

  async addCookies(
    cookies: (Omit<ICookie, 'expires'> & { expires?: string | Date | number })[],
    origins?: string[],
  ) {
    const originUrls = (origins ?? []).map(x => new URL(x));
    const parsedCookies: CookieParam[] = [];
    for (const cookie of cookies) {
      assert(cookie.name, 'Cookie should have a name');
      assert(cookie.value !== undefined && cookie.value !== null, 'Cookie should have a value');
      assert(cookie.domain || cookie.url, 'Cookie should have a domain or url');

      let expires = cookie.expires ?? -1;
      if (expires && typeof expires === 'string') {
        if (expires.match(/\d+/)) {
          expires = parseInt(expires, 10);
        } else {
          expires = new Date(expires).getTime();
        }
      } else if (expires && expires instanceof Date) {
        expires = expires.getTime();
      }

      const cookieToSend: CookieParam = {
        ...cookie,
        expires: expires as number,
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
    await this.cdpRootSessionSend('Storage.setCookies', {
      cookies: parsedCookies,
      browserContextId: this.id,
    });
  }

  private cdpRootSessionSend<T extends keyof ProtocolMapping.Commands>(
    method: T,
    params: ProtocolMapping.Commands[T]['paramsType'][0] = {},
  ): Promise<ProtocolMapping.Commands[T]['returnType']> {
    return this.browser.cdpSession.send(method, params, this);
  }

  private subscribeToDevtoolsMessages(
    cdpSession: CDPSession,
    details: Pick<
      IPuppetContextEvents['devtools-message'],
      'pageTargetId' | 'sessionType' | 'workerTargetId'
    >,
  ) {
    if (this.cdpSessions.has(cdpSession)) return;

    this.cdpSessions.add(cdpSession);
    const shouldFilter = details.sessionType === 'browser';

    const receive = addTypedEventListener(cdpSession.messageEvents, 'receive', event => {
      if (shouldFilter) {
        // see if this was initiated by this browser context
        const { id } = event as any;
        if (id && !this.browserContextInitiatedMessageIds.has(id)) return;
      }
      this.emit('devtools-message', {
        direction: 'receive',
        timestamp: new Date(),
        ...details,
        ...event,
      });
    });
    const send = addTypedEventListener(cdpSession.messageEvents, 'send', (event, initiator) => {
      if (shouldFilter) {
        if (initiator && initiator !== this) return;
        this.browserContextInitiatedMessageIds.add(event.id);
      }
      if (initiator && initiator instanceof Frame) {
        (event as any).frameId = initiator.id;
      }
      this.emit('devtools-message', {
        direction: 'send',
        timestamp: new Date(),
        ...details,
        ...event,
      });
    });
    this.eventListeners.push(receive, send);
  }

  private getPageWithId(targetId: string) {
    return this.pages.find(x => x.targetId === targetId);
  }
}
