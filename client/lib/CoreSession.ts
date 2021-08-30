import { EventEmitter } from 'events';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import IConfigureSessionOptions from '@ulixee/hero-interfaces/IConfigureSessionOptions';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import { loggerSessionIdNames } from '@ulixee/commons/lib/Logger';
import IHeroMeta from '@ulixee/hero-interfaces/IHeroMeta';
import IJsPathResult from '@ulixee/hero-interfaces/IJsPathResult';
import * as readline from 'readline';
import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';
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
  public commandQueue: CoreCommandQueue;
  public eventHeap: CoreEventHeap;
  public emitter = new EventEmitter();

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

  protected readonly meta: ISessionMeta;

  private readonly connectionToCore: ConnectionToCore;
  private commandId = 0;

  constructor(
    sessionMeta: ISessionMeta & { sessionName: string },
    connectionToCore: ConnectionToCore,
  ) {
    const { sessionId, sessionName } = sessionMeta;
    this.sessionId = sessionId;
    this.sessionName = sessionName;
    this.meta = {
      sessionId,
    };
    this.connectionToCore = connectionToCore;
    loggerSessionIdNames.set(sessionId, sessionName);
    this.commandQueue = new CoreCommandQueue({ sessionId, sessionName }, connectionToCore, this);
    this.eventHeap = new CoreEventHeap(this.meta, connectionToCore);

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
        new CoreTab({ ...tabMeta, sessionName: this.sessionName }, this.connectionToCore, this),
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
    const coreTab = new CoreTab(
      { ...meta, sessionName: this.sessionName },
      this.connectionToCore,
      this,
    );
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
      const result = await this.commandQueue.run<{ didKeepAlive: boolean; message: string }>(
        'Session.close',
      );
      if (result?.didKeepAlive === true) {
        await this.showSessionKeepAlivePrompt(result.message);
      }
    } finally {
      process.nextTick(() => this.connectionToCore.closeSession(this));
      loggerSessionIdNames.delete(this.sessionId);
    }
  }

  public async addEventListener(
    jsPath: IJsPath | null,
    eventType: string,
    listenerFn: (...args: any[]) => void,
    options?,
  ): Promise<void> {
    if (eventType === 'command') {
      this.emitter.on(eventType, listenerFn);
    } else {
      await this.eventHeap.addListener(jsPath, eventType, listenerFn, options);
    }
  }

  public async removeEventListener(
    jsPath: IJsPath | null,
    eventType: string,
    listenerFn: (...args: any[]) => void,
  ): Promise<void> {
    if (eventType === 'command') {
      this.emitter.off(eventType, listenerFn);
    } else {
      await this.eventHeap.removeListener(jsPath, eventType, listenerFn);
    }
  }

  private showSessionKeepAlivePrompt(message: string): Promise<void> {
    if (/yes|1|true/i.test(process.env.HERO_CLI_NOPROMPT)) return;

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    readline.emitKeypressEvents(process.stdin);
    process.stdin.setEncoding('utf8');
    if (process.stdin.isTTY) process.stdin.setRawMode(true);

    process.stdout.write(`\n\n${message}\n\nPress Q or kill the CLI to exit and close Chrome:`);

    ShutdownHandler.register(() => this.terminate());

    return new Promise<void>(resolve => {
      process.stdin.on('keypress', async (chunk, key) => {
        if (key.name.toLowerCase() === 'q') {
          await this.terminate();
          rl.close();
          resolve();
        }
      });
      process.once('beforeExit', () => {
        rl.close();
        resolve();
      });
    });
  }

  private terminate(): Promise<void> {
    return this.commandQueue.run('Session.terminate');
  }
}
