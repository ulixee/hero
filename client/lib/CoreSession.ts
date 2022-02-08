import { EventEmitter } from 'events';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import IConfigureSessionOptions from '@ulixee/hero-interfaces/IConfigureSessionOptions';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import { loggerSessionIdNames } from '@ulixee/commons/lib/Logger';
import IHeroMeta from '@ulixee/hero-interfaces/IHeroMeta';
import IJsPathResult from '@ulixee/hero-interfaces/IJsPathResult';
import * as readline from 'readline';
import { ReadLine } from 'readline';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import CoreCommandQueue from './CoreCommandQueue';
import CoreEventHeap from './CoreEventHeap';
import CoreTab from './CoreTab';
import IJsPathEventTarget from '../interfaces/IJsPathEventTarget';
import ConnectionToCore from '../connections/ConnectionToCore';
import ICommandCounter from '../interfaces/ICommandCounter';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import IResourceMeta from '@ulixee/hero-interfaces/IResourceMeta';
import ICollectedElement from '@ulixee/hero-interfaces/ICollectedElement';
import ICollectedSnippet from '@ulixee/hero-interfaces/ICollectedSnippet';
import ICollectedResource from '@ulixee/hero-interfaces/ICollectedResource';
import { IOutputChangeToRecord } from '../interfaces/ICoreSession';
import Hero from './Hero';

export default class CoreSession implements IJsPathEventTarget {
  public tabsById = new Map<number, CoreTab>();
  public frozenTabsById = new Map<number, CoreTab>();
  public sessionId: string;
  public sessionName: string;
  public commandQueue: CoreCommandQueue;
  public eventHeap: CoreEventHeap;
  public emitter = new EventEmitter();
  public readonly mode: ISessionCreateOptions['mode'];
  public readonly hero: Hero;

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

  constructor(
    sessionMeta: ISessionMeta & { sessionName: string },
    connectionToCore: ConnectionToCore,
    hero: Hero,
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
    this.hero = hero;
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

  public addTab(tabMeta: ISessionMeta): CoreTab {
    if (!this.tabsById.has(tabMeta.tabId)) {
      this.tabsById.set(
        tabMeta.tabId,
        new CoreTab({ ...tabMeta, sessionName: this.sessionName }, this.connectionToCore, this),
      );
    }
    return this.tabsById.get(tabMeta.tabId);
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

  // START OF PRIVATE APIS FOR DATABOX /////////////////////////////////////////////////////////////

  public recordOutput(changes: IOutputChangeToRecord[]): void {
    for (const change of changes as any[]) {
      change.lastCommandId = this.lastCommandId;
    }
    this.commandQueue.record({ command: 'Session.recordOutput', args: changes });
  }

  public async collectSnippet(name: string, value: any): Promise<void> {
    await this.commandQueue.run('Session.collectSnippet', name, value);
  }

  public async getCollectedAssetNames(
    sessionId: string,
  ): Promise<{ resources: string[]; elements: string[]; snippets: string[] }> {
    return await this.commandQueue.run('Session.getCollectedAssetNames', sessionId);
  }

  public async getCollectedSnippets(sessionId: string, name: string): Promise<ICollectedSnippet[]> {
    return await this.commandQueue.run('Session.getCollectedSnippets', sessionId, name);
  }

  public async getCollectedElements(sessionId: string, name: string): Promise<ICollectedElement[]> {
    return await this.commandQueue.run('Session.getCollectedElements', sessionId, name);
  }

  public async getCollectedResources(
    sessionId: string,
    name: string,
  ): Promise<ICollectedResource[]> {
    const resources: IResourceMeta[] = await this.commandQueue.run(
      'Session.getCollectedResources',
      sessionId,
      name,
    );
    const results: ICollectedResource[] = [];
    for (const resource of resources) {
      const buffer = resource.response?.body;
      delete resource.response?.body;

      const properties: PropertyDescriptorMap = {
        buffer: { get: () => buffer, enumerable: true },
        json: { get: () => (buffer ? JSON.parse(buffer.toString()) : null), enumerable: true },
        text: { get: () => buffer?.toString(), enumerable: true },
      };

      if (resource.response) {
        Object.defineProperties(resource.response, properties);
      }
      Object.defineProperties(resource, properties);
      results.push(resource as ICollectedResource);
    }
    return results;
  }

  // END OF PRIVATE APIS FOR DATABOX ///////////////////////////////////////////////////////////////

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
    return await this.commandQueue.runOutOfBand('Session.close', force);
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
