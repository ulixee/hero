import { EventEmitter } from 'events';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import { IJsPath } from '@unblocked-web/js-path';
import { loggerSessionIdNames } from '@ulixee/commons/lib/Logger';
import IHeroMeta from '@ulixee/hero-interfaces/IHeroMeta';
import * as readline from 'readline';
import { ReadLine } from 'readline';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import ICollectedElement from '@ulixee/hero-interfaces/ICollectedElement';
import ICollectedSnippet from '@ulixee/hero-interfaces/ICollectedSnippet';
import ICollectedResource from '@ulixee/hero-interfaces/ICollectedResource';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import CoreCommandQueue from './CoreCommandQueue';
import CoreEventHeap from './CoreEventHeap';
import CoreTab from './CoreTab';
import IJsPathEventTarget from '../interfaces/IJsPathEventTarget';
import ConnectionToHeroCore from '../connections/ConnectionToHeroCore';
import ICommandCounter from '../interfaces/ICommandCounter';
import { IOutputChangeToRecord } from '../interfaces/ICoreSession';
import Hero from './Hero';

export default class CoreSession
  extends TypedEventEmitter<{ close: void }>
  implements IJsPathEventTarget
{
  public tabsById = new Map<number, CoreTab>();
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

  private readonly connectionToCore: ConnectionToHeroCore;
  private commandId = 0;
  private cliPrompt: ReadLine;
  private isClosing = false;
  private closingPromise: Promise<{ didKeepAlive: boolean; message?: string }>;

  constructor(
    sessionMeta: ISessionMeta,
    connectionToCore: ConnectionToHeroCore,
    options: ISessionCreateOptions,
  ) {
    super();
    const { sessionName, mode } = options;
    this.mode = mode;
    const { sessionId } = sessionMeta;
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

  // START OF PRIVATE APIS FOR DATABOX /////////////////////////////////////////////////////////////

  public recordOutput(changes: IOutputChangeToRecord[]): void {
    for (const change of changes as any[]) {
      change.lastCommandId = this.lastCommandId;
    }
    this.commandQueue.record({ command: 'Session.recordOutput', args: changes });
  }

  public async collectSnippet(name: string, value: any): Promise<void> {
    await this.commandQueue.run('Session.collectSnippet', name, value, Date.now());
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
    return await this.commandQueue.run('Session.getCollectedResources', sessionId, name);
  }

  // END OF PRIVATE APIS FOR DATABOX ///////////////////////////////////////////////////////////////

  public async close(force = false): Promise<void> {
    await this.closingPromise;
    if (this.isClosing) return;

    try {
      this.isClosing = true;
      this.closeCliPrompt();
      this.closingPromise = this.doClose(force);
      const result = await this.closingPromise;
      this.closingPromise = null;
      if (result?.didKeepAlive === true) {
        this.isClosing = false;
        const didClose = new Promise(resolve => this.addEventListener(null, 'close', resolve));
        this.showSessionKeepAlivePrompt(result.message);
        await didClose;
      }
    } finally {
      this.emit('close');
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

  public async pause(): Promise<void> {
    await this.commandQueue.run('Session.pauseCommands');
  }

  private async doClose(force: boolean): Promise<{ didKeepAlive: boolean; message: string }> {
    await this.commandQueue.flush();
    for (const tab of this.tabsById.values()) {
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
    if (/yes|1|true/i.test(process.env.ULX_CLI_NOPROMPT)) return;

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
