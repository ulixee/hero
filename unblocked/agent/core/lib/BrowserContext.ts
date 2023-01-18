import { assert } from '@ulixee/commons/lib/utils';
import IBrowserContext, {
  IBrowserContextEvents,
} from '@ulixee/unblocked-specification/agent/browser/IBrowserContext';
import { ICookie } from '@ulixee/unblocked-specification/agent/net/ICookie';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import { URL } from 'url';
import Protocol from 'devtools-protocol';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import ProtocolMapping from 'devtools-protocol/types/protocol-mapping';
import { IPage } from '@ulixee/unblocked-specification/agent/browser/IPage';
import {
  IBrowserContextHooks,
  IInteractHooks,
} from '@ulixee/unblocked-specification/agent/hooks/IHooks';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import IDomStorage from '@ulixee/unblocked-specification/agent/browser/IDomStorage';
import Log from '@ulixee/commons/lib/Logger';
import IProxyConnectionOptions from '../interfaces/IProxyConnectionOptions';
import ICommandMarker from '../interfaces/ICommandMarker';
import Page, { IPageCreateOptions } from './Page';
import { Worker } from './Worker';
import Browser from './Browser';
import DevtoolsSession from './DevtoolsSession';
import Resources from './Resources';
import WebsocketMessages from './WebsocketMessages';
import { DefaultCommandMarker } from './DefaultCommandMarker';
import DevtoolsSessionLogger from './DevtoolsSessionLogger';
import CookieParam = Protocol.Network.CookieParam;
import TargetInfo = Protocol.Target.TargetInfo;
import CreateBrowserContextRequest = Protocol.Target.CreateBrowserContextRequest;

const { log } = Log(module);

export interface IBrowserContextCreateOptions {
  logger?: IBoundLog;
  proxy?: IProxyConnectionOptions;
  hooks?: IBrowserContextHooks & IInteractHooks;
  isIncognito?: boolean;
  commandMarker?: ICommandMarker;
}

export default class BrowserContext
  extends TypedEventEmitter<IBrowserContextEvents>
  implements IBrowserContext
{
  public logger: IBoundLog;
  public lastOpenedPage: Page;

  public resources: Resources;
  public websocketMessages: WebsocketMessages;
  public workersById = new Map<string, Worker>();
  public pagesById = new Map<string, Page>();
  public pagesByTabId = new Map<number, Page>();
  public devtoolsSessionsById = new Map<string, DevtoolsSession>();
  public devtoolsSessionLogger: DevtoolsSessionLogger;
  public proxy: IProxyConnectionOptions;
  public domStorage: IDomStorage;
  public id: string;
  public hooks: IBrowserContextHooks & IInteractHooks = {};

  public readonly browser: Browser;
  public get browserId(): string {
    return this.browser.id;
  }

  public isIncognito = true;

  public readonly idTracker = {
    navigationId: 0,
    tabId: 0,
    frameId: 0,
  };

  public commandMarker: ICommandMarker;

  private attachedTargetIds = new Set<string>();
  private pageOptionsByTargetId = new Map<string, IPageCreateOptions>();
  private readonly createdTargetIds = new Set<string>();
  private creatingTargetPromises: Promise<void>[] = [];
  private waitForPageAttachedById = new Map<string, Resolvable<Page>>();

  private isClosing: Promise<void>;

  private readonly events = new EventSubscriber();

  constructor(browser: Browser, isIncognito: boolean, options?: IBrowserContextCreateOptions) {
    super();
    this.browser = browser;
    this.proxy = options?.proxy;
    this.isIncognito = isIncognito;
    this.logger = options?.logger;
    this.hooks = options?.hooks ?? {};
    this.commandMarker = options?.commandMarker ?? new DefaultCommandMarker(this);
    this.resources = new Resources(this);
    this.websocketMessages = new WebsocketMessages(this.logger);
    this.devtoolsSessionLogger = new DevtoolsSessionLogger(this);

    this.devtoolsSessionLogger.subscribeToDevtoolsMessages(this.browser.devtoolsSession, {
      sessionType: 'browser',
    });
  }

  public async open(): Promise<void> {
    if (!this.isIncognito) return;

    const createContextOptions: CreateBrowserContextRequest = {
      disposeOnDetach: true,
    };
    if (this.proxy?.address) {
      createContextOptions.proxyBypassList = '<-loopback>';
      createContextOptions.proxyServer = this.proxy.address;
    }

    // Creates a new incognito browser context. This won't share cookies/cache with other browser contexts.
    const { browserContextId } = await this.browser.devtoolsSession.send(
      'Target.createBrowserContext',
      createContextOptions,
      this,
    );
    this.id = browserContextId;
    this.logger ??= log.createChild(module, {
      browserContextId,
    });
  }

  public defaultPageInitializationFn: (page: IPage) => Promise<any> = () => Promise.resolve();

  async newPage(options?: IPageCreateOptions): Promise<Page> {
    const createTargetPromise = new Resolvable<void>();
    this.creatingTargetPromises.push(createTargetPromise.promise);

    const { targetId } = await this.sendWithBrowserDevtoolsSession('Target.createTarget', {
      url: 'about:blank',
      browserContextId: this.id,
      background: options ? true : undefined,
    });
    this.createdTargetIds.add(targetId);
    this.pageOptionsByTargetId.set(targetId, options);

    await this.attachToTarget(targetId);

    createTargetPromise.resolve();
    const idx = this.creatingTargetPromises.indexOf(createTargetPromise.promise);
    if (idx >= 0) this.creatingTargetPromises.splice(idx, 1);

    let page = this.pagesById.get(targetId);
    if (!page) {
      const pageAttachedPromise = new Resolvable<Page>(
        60e3,
        'Error creating page. Timed-out waiting to attach',
      );
      this.waitForPageAttachedById.set(targetId, pageAttachedPromise);
      page = await pageAttachedPromise.promise;
      this.waitForPageAttachedById.delete(targetId);
    }

    await page.isReady;
    if (page.isClosed) throw new Error('Page has been closed.');
    return page;
  }

  trackPage(page: Page): void {
    this.pagesById.set(page.id, page);
    this.pagesByTabId.set(page.tabId, page);
  }

  initializePage(page: Page): Promise<any> {
    if (page.runPageScripts === false) return Promise.resolve();

    return Promise.all([this.defaultPageInitializationFn(page), this.hooks.onNewPage?.(page)]);
  }

  async onPageAttached(devtoolsSession: DevtoolsSession, targetInfo: TargetInfo): Promise<Page> {
    this.attachedTargetIds.add(targetInfo.targetId);
    await Promise.all(this.creatingTargetPromises);
    if (this.pagesById.has(targetInfo.targetId)) return;

    this.devtoolsSessionLogger.subscribeToDevtoolsMessages(devtoolsSession, {
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
    this.lastOpenedPage = page;
    this.waitForPageAttachedById.get(page.targetId)?.resolve(page);
    await page.isReady;
    this.emit('page', { page });
    return page;
  }

  onTargetDetached(targetId: string): void {
    this.attachedTargetIds.delete(targetId);
    const page = this.pagesById.get(targetId);
    if (page) {
      this.pagesById.delete(targetId);
      this.pagesByTabId.delete(page.tabId);
      page.didClose();
      if (this.pagesById.size === 0) {
        this.emit('all-pages-closed');
      }
      return;
    }

    const devtoolsSession = this.devtoolsSessionsById.get(targetId);
    if (devtoolsSession) {
      this.onDevtoolsPanelDetached(devtoolsSession);
    }
  }

  onDevtoolsPanelAttached(devtoolsSession: DevtoolsSession, targetInfo: TargetInfo): void {
    this.devtoolsSessionsById.set(targetInfo.targetId, devtoolsSession);
    this.hooks.onDevtoolsPanelAttached?.(devtoolsSession).catch(() => null);
  }

  onDevtoolsPanelDetached(devtoolsSession: DevtoolsSession): void {
    this.hooks.onDevtoolsPanelDetached?.(devtoolsSession).catch(() => null);
  }

  async onSharedWorkerAttached(
    devtoolsSession: DevtoolsSession,
    targetInfo: TargetInfo,
  ): Promise<void> {
    const page: Page =
      [...this.pagesById.values()].find(x => !x.isClosed) ?? this.pagesById.values().next().value;

    await page.onWorkerAttached(devtoolsSession, targetInfo);
  }

  beforeWorkerAttached(
    devtoolsSession: DevtoolsSession,
    workerTargetId: string,
    pageTargetId: string,
  ): void {
    this.devtoolsSessionLogger.subscribeToDevtoolsMessages(devtoolsSession, {
      sessionType: 'worker' as const,
      pageTargetId,
      workerTargetId,
    });
  }

  onWorkerAttached(worker: Worker): void {
    this.workersById.set(worker.id, worker);
    this.events.once(worker, 'close', () => this.workersById.delete(worker.id));
    this.emit('worker', { worker });
  }

  targetDestroyed(targetId: string): void {
    this.attachedTargetIds.delete(targetId);
    const page = this.pagesById.get(targetId);
    if (page) page.didClose();
  }

  targetKilled(targetId: string, errorCode: number): void {
    const page = this.pagesById.get(targetId);
    if (page) page.onTargetKilled(errorCode);
  }

  async attachToTarget(targetId: string): Promise<void> {
    // chrome 80 still needs you to manually attach
    if (!this.attachedTargetIds.has(targetId)) {
      await this.sendWithBrowserDevtoolsSession('Target.attachToTarget', {
        targetId,
        flatten: true,
      });
    }
  }

  async attachToWorker(targetInfo: TargetInfo): Promise<void> {
    await this.sendWithBrowserDevtoolsSession('Target.attachToTarget', {
      targetId: targetInfo.targetId,
      flatten: true,
    });
  }

  async close(): Promise<void> {
    if (this.isClosing) return this.isClosing;
    const resolvable = new Resolvable<void>();
    this.isClosing = resolvable.promise;
    try {
      const logId = this.logger.info('BrowserContext.Closing');
      for (const waitingPage of this.waitForPageAttachedById.values()) {
        await waitingPage.reject(new CanceledPromiseError('BrowserContext shutting down'), true);
      }
      if (this.browser.devtoolsSession.isConnected()) {
        await Promise.all([...this.pagesById.values()].map(x => x.close()));
        // can only close with id
        if (this.id) {
          await this.sendWithBrowserDevtoolsSession('Target.disposeBrowserContext', {
            browserContextId: this.id,
          }).catch(err => {
            if (err instanceof CanceledPromiseError) return;
            throw err;
          });
        }
      }
      this.websocketMessages.cleanup();
      this.resources.cleanup();
      this.events.close();
      this.emit('close');
      this.devtoolsSessionLogger.close();
      this.removeAllListeners();
      this.cleanup();
      this.logger.stats('BrowserContext.Closed', { parentLogId: logId });
    } finally {
      resolvable.resolve();
    }
    return this.isClosing;
  }

  async getCookies(url?: URL): Promise<ICookie[]> {
    const { cookies } = await this.sendWithBrowserDevtoolsSession('Storage.getCookies', {
      browserContextId: this.id,
    });
    return cookies
      .map(c => {
        return <ICookie>{
          name: c.name,
          value: c.value,
          secure: c.secure,
          sameSite: c.sameSite ?? 'None',
          sameParty: (c as any).sameParty,
          expires: c.expires === -1 ? undefined : new Date(c.expires * 1000).toISOString(),
          httpOnly: c.httpOnly,
          path: c.path,
          domain: c.domain,
        };
      })
      .filter(c => {
        if (!url) return true;

        let domain = c.domain;
        if (!domain.startsWith('.')) domain = `.${domain}`;
        if (!`.${url.hostname}`.endsWith(domain)) return false;
        if (!url.pathname.startsWith(c.path)) return false;
        if (c.secure === true && url.protocol !== 'https:') return false;
        return true;
      });
  }

  async addCookies(
    cookies: (Omit<ICookie, 'expires'> & { expires?: string | Date | number })[],
    origins?: string[],
  ): Promise<void> {
    const originUrls = (origins ?? []).map(x => new URL(x));
    const parsedCookies: CookieParam[] = [];
    for (const cookie of cookies) {
      assert(cookie.name, 'Cookie should have a name');
      assert(cookie.value !== undefined && cookie.value !== null, 'Cookie should have a value');
      assert(cookie.domain || cookie.url, 'Cookie should have a domain or url');

      let expires = cookie.expires ?? -1;
      if (expires && typeof expires === 'string') {
        if (expires === '-1') {
          expires = undefined;
        } else if (expires.match(/^[.\d]+$/)) {
          expires = parseInt(expires, 10);
          if (expires > 1e10) expires /= 1e3;
        } else {
          expires = new Date(expires).getTime() / 1e3;
        }
      } else if (expires && expires instanceof Date) {
        expires = expires.getTime() / 1e3;
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

  private cleanup(): void {
    this.devtoolsSessionLogger = null;
    this.workersById.clear();
    this.pagesById.clear();
    this.pagesByTabId.clear();
    this.devtoolsSessionsById.clear();
    this.defaultPageInitializationFn = null;
    this.waitForPageAttachedById = null;
    this.creatingTargetPromises.length = null;
    this.commandMarker = null;
  }
}
