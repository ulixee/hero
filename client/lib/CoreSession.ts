import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import IConfigureSessionOptions from '@ulixee/hero-interfaces/IConfigureSessionOptions';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import { loggerSessionIdNames } from '@ulixee/commons/Logger';
import IHeroMeta from '@ulixee/hero-interfaces/IHeroMeta';
import IJsPathResult from '@ulixee/hero-interfaces/IJsPathResult';
import CoreCommandQueue from './CoreCommandQueue';
import CoreEventHeap from './CoreEventHeap';
import CoreTab from './CoreTab';
import IJsPathEventTarget from '../interfaces/IJsPathEventTarget';
import ConnectionToCore from '../connections/ConnectionToCore';

export default class CoreSession implements IJsPathEventTarget {
  public tabsById = new Map<number, CoreTab>();
  public frozenTabsById = new Map<number, CoreTab>();
  public sessionId: string;
  public sessionName: string;
  public sessionsDataLocation: string;
  public commandQueue: CoreCommandQueue;
  public eventHeap: CoreEventHeap;

  public get lastCommandId(): number {
    return this.commandId;
  }

  public get nextCommandId(): number {
    this.commandId += 1;
    return this.commandId;
  }

  public get firstTab(): CoreTab {
    return [...this.tabsById.values()][0];
  }

  public get replayApiUrl(): Promise<string> {
    return this.connection.hostOrError.then(x => {
      if (x instanceof Error) {
        throw x;
      }
      return `${x}/replay`;
    });
  }

  protected readonly meta: ISessionMeta;
  private readonly connection: ConnectionToCore;
  private commandId = 0;

  constructor(sessionMeta: ISessionMeta & { sessionName: string }, connection: ConnectionToCore) {
    const { sessionId, sessionsDataLocation, sessionName } = sessionMeta;
    this.sessionId = sessionId;
    this.sessionName = sessionName;
    this.sessionsDataLocation = sessionsDataLocation;
    this.meta = {
      sessionId,
    };
    this.connection = connection;
    loggerSessionIdNames.set(sessionId, sessionName);
    this.commandQueue = new CoreCommandQueue({ sessionId, sessionName }, connection, this);
    this.eventHeap = new CoreEventHeap(this.meta, connection);

    this.addTab(sessionMeta);
  }

  public onEvent(meta: ISessionMeta, listenerId: string, eventData: any): void {
    if (meta.tabId) {
      const coreTab = this.tabsById.get(meta.tabId);
      coreTab?.eventHeap?.incomingEvent(meta, listenerId, eventData);
    } else {
      this.eventHeap.incomingEvent(meta, listenerId, eventData);
    }
  }

  public recordOutput(
    changes: { type: string; value: any; path: string; timestamp: Date }[],
  ): void {
    for (const change of changes) (change as any).lastCommandId = this.lastCommandId;
    this.commandQueue.record({ command: 'Session.recordOutput', args: changes });
  }

  public getHeroMeta(): Promise<IHeroMeta> {
    return this.commandQueue.run('Session.getHeroMeta');
  }

  public async configure(options?: Partial<IConfigureSessionOptions>): Promise<void> {
    await this.commandQueue.run('Session.configure', options);
  }

  public async getTabs(): Promise<CoreTab[]> {
    const tabSessionMetas = await this.commandQueue.run<ISessionMeta[]>('Session.getTabs');
    for (const tabMeta of tabSessionMetas) {
      this.addTab(tabMeta);
    }
    return [...this.tabsById.values()];
  }

  public addTab(tabMeta: ISessionMeta): void {
    if (!this.tabsById.has(tabMeta.tabId)) {
      this.tabsById.set(
        tabMeta.tabId,
        new CoreTab({ ...tabMeta, sessionName: this.sessionName }, this.connection, this),
      );
    }
  }

  public removeTab(tab: CoreTab): void {
    this.tabsById.delete(tab.tabId);
  }

  public async detachTab(
    tab: CoreTab,
    callSitePath: string,
    key?: string,
  ): Promise<{ coreTab: CoreTab; prefetchedJsPaths: IJsPathResult[] }> {
    const { meta, prefetchedJsPaths } = await this.commandQueue.run<{
      meta: ISessionMeta;
      prefetchedJsPaths: IJsPathResult[];
    }>('Session.detachTab', tab.tabId, callSitePath, key);
    const coreTab = new CoreTab({ ...meta, sessionName: this.sessionName }, this.connection, this);
    this.frozenTabsById.set(meta.tabId, coreTab);
    return {
      coreTab,
      prefetchedJsPaths,
    };
  }

  public async close(): Promise<void> {
    try {
      await this.commandQueue.flush();
      for (const tab of this.tabsById.values()) {
        await tab.flush();
      }
      for (const tab of this.frozenTabsById.values()) {
        await tab.flush();
      }
      await this.commandQueue.run('Session.close');
    } finally {
      process.nextTick(() => this.connection.closeSession(this));
      loggerSessionIdNames.delete(this.sessionId);
    }
  }

  public async addEventListener(
    jsPath: IJsPath | null,
    eventType: string,
    listenerFn: (...args: any[]) => void,
    options?,
  ): Promise<void> {
    await this.eventHeap.addListener(jsPath, eventType, listenerFn, options);
  }

  public async removeEventListener(
    jsPath: IJsPath | null,
    eventType: string,
    listenerFn: (...args: any[]) => void,
  ): Promise<void> {
    await this.eventHeap.removeListener(jsPath, eventType, listenerFn);
  }
}
