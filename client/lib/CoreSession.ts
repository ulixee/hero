import ISessionMeta from '@secret-agent/core-interfaces/ISessionMeta';
import IConfigureSessionOptions from '@secret-agent/core-interfaces/IConfigureSessionOptions';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import CoreCommandQueue from './CoreCommandQueue';
import CoreEventHeap from './CoreEventHeap';
import CoreTab from './CoreTab';
import IJsPathEventTarget from '../interfaces/IJsPathEventTarget';
import CoreClientConnection from '../connections/CoreClientConnection';

export default class CoreSession implements IJsPathEventTarget {
  public tabsById = new Map<string, CoreTab>();
  public sessionId: string;
  public sessionsDataLocation: string;
  public replayApiServer: string;
  public commandQueue: CoreCommandQueue;
  public eventHeap: CoreEventHeap;

  public get firstTab(): CoreTab {
    return [...this.tabsById.values()][0];
  }

  protected readonly meta: ISessionMeta;
  private readonly connection: CoreClientConnection;

  constructor(sessionMeta: ISessionMeta, connection: CoreClientConnection) {
    const { sessionId, sessionsDataLocation, replayApiServer } = sessionMeta;
    this.sessionId = sessionId;
    this.sessionsDataLocation = sessionsDataLocation;
    this.replayApiServer = replayApiServer;
    this.meta = {
      sessionId,
    };
    this.connection = connection;
    this.commandQueue = new CoreCommandQueue(this.meta, connection);
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

  public async configure(options?: Partial<IConfigureSessionOptions>): Promise<void> {
    await this.commandQueue.run('configure', options);
  }

  public async getTabs(): Promise<CoreTab[]> {
    const tabSessionMetas = await this.commandQueue.run<ISessionMeta[]>('getTabs');
    for (const tabMeta of tabSessionMetas) {
      this.addTab(tabMeta);
    }
    return [...this.tabsById.values()];
  }

  public addTab(tabMeta: ISessionMeta): void {
    if (!this.tabsById.has(tabMeta.tabId)) {
      this.tabsById.set(tabMeta.tabId, new CoreTab(tabMeta, this.connection));
    }
  }

  public removeTab(tab: CoreTab): void {
    this.tabsById.delete(tab.tabId);
  }

  public async close(): Promise<void> {
    await this.commandQueue.run('closeSession');
    process.nextTick(() => this.connection.closeSession(this));
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
