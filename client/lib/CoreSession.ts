import { EventEmitter } from 'events';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import IConfigureSessionOptions from '@ulixee/hero-interfaces/IConfigureSessionOptions';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import { loggerSessionIdNames } from '@ulixee/commons/lib/Logger';
import IHeroMeta from '@ulixee/hero-interfaces/IHeroMeta';
import IJsPathResult from '@ulixee/hero-interfaces/IJsPathResult';
import * as readline from 'readline';
import { ReadLine } from 'readline';
import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import CoreCommandQueue from './CoreCommandQueue';
import CoreEventHeap from './CoreEventHeap';
import CoreTab from './CoreTab';
import IJsPathEventTarget from '../interfaces/IJsPathEventTarget';
import ConnectionToCore from '../connections/ConnectionToCore';
import ICommandCounter from '../interfaces/ICommandCounter';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import IResourceMeta from '@ulixee/hero-interfaces/IResourceMeta';
import ICollectedFragment from '@ulixee/hero-interfaces/ICollectedFragment';

export default class CoreSession implements IJsPathEventTarget {
  public tabsById = new Map<number, CoreTab>();
  public frozenTabsById = new Map<number, CoreTab>();
  public sessionId: string;
  public sessionName: string;
  public commandQueue: CoreCommandQueue;
  public eventHeap: CoreEventHeap;
  public emitter = new EventEmitter();
  public readonly mode: ISessionCreateOptions['mode'];

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
  private cliPrompt: ReadLine;
  private isClosing = false;
  private shutdownPromise: Promise<{ didKeepAlive: boolean; message?: string }>;
  private extractorPromises: Promise<void>[] = [];

  constructor(
    sessionMeta: ISessionMeta & { sessionName: string },
    connectionToCore: ConnectionToCore,
    mode: ISessionCreateOptions['mode'],
  ) {
    this.mode = mode;
    const { sessionId, sessionName } = sessionMeta;
    this.sessionId = sessionId;
    this.sessionName = sessionName;
    this.meta = {
      sessionId,
    };
    this.connectionToCore = connectionToCore;
    loggerSessionIdNames.set(sessionId, sessionName);
    this.commandQueue = new CoreCommandQueue(
      { sessionId, sessionName },
      mode,
      connectionToCore,
      this as ICommandCounter,
    );
    this.eventHeap = new CoreEventHeap(this.meta, connectionToCore, this as ICommandCounter);

    this.addTab(sessionMeta);
  }

  public onEvent(
    meta: ISessionMeta,
    listenerId: string,
    eventData: any,
    lastCommandId?: number,
  ): void {
    if (lastCommandId && lastCommandId > this.commandId) {
      this.commandId = lastCommandId;
    }

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

  public recordOutput(
    changes: { type: string; value: any; path: string; timestamp: Date }[],
  ): void {
    for (const change of changes as any[]) {
      change.lastCommandId = this.lastCommandId;
    }
    this.commandQueue.record({ command: 'Session.recordOutput', args: changes });
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
    callsitePath: string,
    key?: string,
  ): Promise<{ coreTab: CoreTab; prefetchedJsPaths: IJsPathResult[] }> {
    const { detachedTab, prefetchedJsPaths } = await this.commandQueue.run<{
      detachedTab: ISessionMeta;
      prefetchedJsPaths: IJsPathResult[];
    }>('Session.detachTab', tab.tabId, callsitePath, key);
    const coreTab = new CoreTab(
      { ...detachedTab, sessionName: this.sessionName },
      this.connectionToCore,
      this,
    );
    this.frozenTabsById.set(detachedTab.tabId, coreTab);
    return {
      coreTab,
      prefetchedJsPaths,
    };
  }

  public addExtractorPromises(promise: Promise<void>): void {
    this.extractorPromises.push(promise);
  }

  public getExtractorPromises(): Promise<void>[] {
    return [...this.extractorPromises];
  }

  public async getCollectedResources(sessionId: string, name: string): Promise<IResourceMeta[]> {
    return await this.commandQueue.run('Session.getCollectedResources', sessionId, name);
  }

  public async getCollectedFragments(
    sessionId: string,
    name: string,
  ): Promise<ICollectedFragment[]> {
    return await this.commandQueue.run('Session.getCollectedFragments', sessionId, name);
  }

  public async close(force = false): Promise<void> {
    await this.shutdownPromise;
    if (this.isClosing) return;

    try {
      this.isClosing = true;
      this.closeCliPrompt();
      this.shutdownPromise = this.doClose(force);
      const result = await this.shutdownPromise;
      this.shutdownPromise = null;
      if (result?.didKeepAlive === true) {
        this.isClosing = false;
        const didClose = new Promise(resolve => this.addEventListener(null, 'close', resolve));
        this.showSessionKeepAlivePrompt(result.message);
        await didClose;
      }
    } finally {
      process.nextTick(() => this.connectionToCore.untrackSession(this));
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

  private async doClose(force: boolean): Promise<{ didKeepAlive: boolean; message: string }> {
    await this.commandQueue.flush();
    for (const tab of this.tabsById.values()) {
      await tab.flush();
    }
    for (const tab of this.frozenTabsById.values()) {
      await tab.flush();
    }
    return await this.commandQueue.run('Session.close', force);
  }

  private closeCliPrompt(): void {
    if (this.cliPrompt) {
      this.cliPrompt.close();
      this.cliPrompt = null;
    }
  }

  private showSessionKeepAlivePrompt(message: string): void {
    if (/yes|1|true/i.test(process.env.HERO_CLI_NOPROMPT)) return;

    this.cliPrompt = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    readline.emitKeypressEvents(process.stdin);
    process.stdin.setEncoding('utf8');
    if (process.stdin.isTTY) process.stdin.setRawMode(true);

    this.cliPrompt.setPrompt(
      `\n\n${message}\n\nPress Q or kill the CLI to exit and close Chrome:\n\n`,
    );

    ShutdownHandler.register(() => this.close(true));
    process.stdin.on('keypress', async (chunk, key) => {
      if (
        key.name?.toLowerCase() === 'q' ||
        (key.name?.toLowerCase() === 'c' && key.ctrl === true)
      ) {
        try {
          await this.close(true);
        } catch (error) {
          if (error instanceof CanceledPromiseError) return;
          throw error;
        }
      }
    });
    process.once('beforeExit', () => this.closeCliPrompt());
    this.cliPrompt.prompt(true);
  }
}
