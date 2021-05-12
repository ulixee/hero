import { assert } from '@secret-agent/commons/utils';
import IPuppetContext, {
  IPuppetContextEvents,
  IPuppetPageOptions,
} from '@secret-agent/interfaces/IPuppetContext';
import { ICookie } from '@secret-agent/interfaces/ICookie';
import { URL } from 'url';
import Protocol from 'devtools-protocol';
import {
  addTypedEventListener,
  removeEventListeners,
  TypedEventEmitter,
} from '@secret-agent/commons/eventUtils';
import { IBoundLog } from '@secret-agent/interfaces/ILog';
import IRegisteredEventListener from '@secret-agent/interfaces/IRegisteredEventListener';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import { IPuppetWorker } from '@secret-agent/interfaces/IPuppetWorker';
import ProtocolMapping from 'devtools-protocol/types/protocol-mapping';
import IBrowserEmulator from '@secret-agent/interfaces/IBrowserEmulator';
import { IPuppetPage } from '@secret-agent/interfaces/IPuppetPage';
import IProxyConnectionOptions from '@secret-agent/interfaces/IProxyConnectionOptions';
import Resolvable from '@secret-agent/commons/Resolvable';
import { Page } from './Page';
import { Browser } from './Browser';
import { DevtoolsSession } from './DevtoolsSession';
import Frame from './Frame';
import CookieParam = Protocol.Network.CookieParam;
import TargetInfo = Protocol.Target.TargetInfo;

export class BrowserContext
  extends TypedEventEmitter<IPuppetContextEvents>
  implements IPuppetContext {
  public logger: IBoundLog;

  public workersById = new Map<string, IPuppetWorker>();
  public pagesById = new Map<string, Page>();
  public emulator: IBrowserEmulator;
  public proxy: IProxyConnectionOptions;

  private pageOptionsByTargetId = new Map<string, IPuppetPageOptions>();
  private readonly createdTargetIds = new Set<string>();
  private creatingTargetPromises: Promise<void>[] = [];
  private readonly browser: Browser;
  private readonly id: string;

  private isClosing = false;

  private devtoolsSessions = new WeakSet<DevtoolsSession>();
  private eventListeners: IRegisteredEventListener[] = [];
  private browserContextInitiatedMessageIds = new Set<number>();

  constructor(
    browser: Browser,
    emulator: IBrowserEmulator,
    contextId: string,
    logger: IBoundLog,
    proxy?: IProxyConnectionOptions,
  ) {
    super();
    this.emulator = emulator;
    this.browser = browser;
    this.id = contextId;
    this.logger = logger.createChild(module, {
      browserContextId: contextId,
    });
    this.proxy = proxy;
    this.browser.browserContextsById.set(this.id, this);

    this.subscribeToDevtoolsMessages(this.browser.devtoolsSession, {
      sessionType: 'browser',
    });
  }

  public defaultPageInitializationFn: (page: IPuppetPage) => Promise<any> = () => Promise.resolve();

  async newPage(options?: IPuppetPageOptions): Promise<Page> {
    const resolvable = new Resolvable<void>();
    this.creatingTargetPromises.push(resolvable.promise);

    const { targetId } = await this.sendWithBrowserDevtoolsSession('Target.createTarget', {
      url: 'about:blank',
      browserContextId: this.id,
      background: options ? true : undefined,
    });
    this.createdTargetIds.add(targetId);
    this.pageOptionsByTargetId.set(targetId, options);

    await this.attachToTarget(targetId);

    resolvable.resolve();
    const idx = this.creatingTargetPromises.indexOf(resolvable.promise);
    if (idx >= 0) this.creatingTargetPromises.splice(idx, 1);

    // NOTE: flow here interrupts and expects session to attach and call onPageAttached below
    while (!this.isClosing) {
      const page = this.pagesById.get(targetId);
      if (!page) {
        await new Promise(setImmediate);
        continue;
      }
      await page.isReady;
      if (page.isClosed) throw new Error('Page has been closed.');
      return page;
    }
  }

  initializePage(page: Page): Promise<any> {
    if (this.pageOptionsByTargetId.get(page.targetId)?.runPageScripts === false) return;

    const promises = [this.defaultPageInitializationFn(page).catch(err => err)];
    if (this.emulator?.onNewPuppetPage) {
      promises.push(this.emulator.onNewPuppetPage(page).catch(err => err));
    }
    return Promise.all(promises);
  }

  async onPageAttached(devtoolsSession: DevtoolsSession, targetInfo: TargetInfo): Promise<Page> {
    await Promise.all(this.creatingTargetPromises);
    if (this.pagesById.has(targetInfo.targetId)) return;

    this.subscribeToDevtoolsMessages(devtoolsSession, {
      sessionType: 'page',
      pageTargetId: targetInfo.targetId,
    });

    const pageOptions = this.pageOptionsByTargetId.get(targetInfo.targetId);

    let opener = targetInfo.openerId ? this.pagesById.get(targetInfo.openerId) || null : null;
    if (pageOptions?.triggerPopupOnPageId) {
      opener = this.pagesById.get(pageOptions.triggerPopupOnPageId);
    }
    // make the first page the active page
    if (!opener && !this.createdTargetIds.has(targetInfo.targetId)) {
      opener = this.pagesById.values().next().value;
    }

    const page = new Page(
      devtoolsSession,
      targetInfo.targetId,
      this,
      this.logger,
      opener,
      pageOptions,
    );
    this.pagesById.set(page.targetId, page);
    await page.isReady;
    this.emit('page', { page });
    return page;
  }

  onPageDetached(targetId: string) {
    const page = this.pagesById.get(targetId);
    if (page) {
      this.pagesById.delete(targetId);
      page.didClose();
    }
  }

  async onSharedWorkerAttached(devtoolsSession: DevtoolsSession, targetInfo: TargetInfo) {
    const page: Page =
      [...this.pagesById.values()].find(x => !x.isClosed) ?? this.pagesById.values().next().value;
    await page.onWorkerAttached(devtoolsSession, targetInfo);
  }

  beforeWorkerAttached(
    devtoolsSession: DevtoolsSession,
    workerTargetId: string,
    pageTargetId: string,
  ) {
    this.subscribeToDevtoolsMessages(devtoolsSession, {
      sessionType: 'worker' as const,
      pageTargetId,
      workerTargetId,
    });
  }

  onWorkerAttached(worker: IPuppetWorker) {
    this.workersById.set(worker.id, worker);
    worker.on('close', () => this.workersById.delete(worker.id));
    this.emit('worker', { worker });
  }

  targetDestroyed(targetId: string) {
    const page = this.pagesById.get(targetId);
    if (page) page.didClose();
  }

  targetKilled(targetId: string, errorCode: number) {
    const page = this.pagesById.get(targetId);
    if (page) page.onTargetKilled(errorCode);
  }

  async attachToTarget(targetId: string) {
    // chrome 80 still needs you to manually attach
    if (!this.pagesById.has(targetId)) {
      await this.sendWithBrowserDevtoolsSession('Target.attachToTarget', {
        targetId,
        flatten: true,
      });
    }
  }

  async attachToWorker(targetInfo: TargetInfo) {
    await this.sendWithBrowserDevtoolsSession('Target.attachToTarget', {
      targetId: targetInfo.targetId,
      flatten: true,
    });
  }

  async close(): Promise<void> {
    if (this.isClosing) return;
    this.isClosing = true;

    await Promise.all([...this.pagesById.values()].map(x => x.close()));
    await this.sendWithBrowserDevtoolsSession('Target.disposeBrowserContext', {
      browserContextId: this.id,
    }).catch(err => {
      if (err instanceof CanceledPromiseError) return;
      throw err;
    });
    removeEventListeners(this.eventListeners);
    this.browser.browserContextsById.delete(this.id);
  }

  async getCookies(url?: URL): Promise<ICookie[]> {
    const { cookies } = await this.sendWithBrowserDevtoolsSession('Storage.getCookies', {
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

        if (url.hostname !== c.domain && !url.hostname.includes(c.domain)) return false;
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
    await this.sendWithBrowserDevtoolsSession('Storage.setCookies', {
      cookies: parsedCookies,
      browserContextId: this.id,
    });
  }

  private sendWithBrowserDevtoolsSession<T extends keyof ProtocolMapping.Commands>(
    method: T,
    params: ProtocolMapping.Commands[T]['paramsType'][0] = {},
  ): Promise<ProtocolMapping.Commands[T]['returnType']> {
    return this.browser.devtoolsSession.send(method, params, this);
  }

  private subscribeToDevtoolsMessages(
    devtoolsSession: DevtoolsSession,
    details: Pick<
      IPuppetContextEvents['devtools-message'],
      'pageTargetId' | 'sessionType' | 'workerTargetId'
    >,
  ) {
    if (this.devtoolsSessions.has(devtoolsSession)) return;

    this.devtoolsSessions.add(devtoolsSession);
    const shouldFilter = details.sessionType === 'browser';

    const receive = addTypedEventListener(devtoolsSession.messageEvents, 'receive', event => {
      if (shouldFilter) {
        // see if this was initiated by this browser context
        const { id, targetInfo } = event as any;
        if (id && !this.browserContextInitiatedMessageIds.has(id)) return;

        // see if this has a browser context target
        const target = targetInfo as TargetInfo;
        if (target && target.browserContextId && target.browserContextId !== this.id) return;
      }
      this.emit('devtools-message', {
        direction: 'receive',
        ...details,
        ...event,
      });
    });
    const send = addTypedEventListener(
      devtoolsSession.messageEvents,
      'send',
      (event, initiator) => {
        if (shouldFilter) {
          if (initiator && initiator !== this) return;
          this.browserContextInitiatedMessageIds.add(event.id);
        }
        if (initiator && initiator instanceof Frame) {
          (event as any).frameId = initiator.id;
        }
        this.emit('devtools-message', {
          direction: 'send',
          ...details,
          ...event,
        });
      },
    );
    this.eventListeners.push(receive, send);
  }
}
