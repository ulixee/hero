import { EventEmitter } from 'events';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import { IJsPath } from '@ulixee/js-path';
import { loggerSessionIdNames } from '@ulixee/commons/lib/Logger';
import IHeroMeta from '@ulixee/hero-interfaces/IHeroMeta';
import * as readline from 'readline';
import { ReadLine } from 'readline';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import IDetachedElement from '@ulixee/hero-interfaces/IDetachedElement';
import IDataSnippet from '@ulixee/hero-interfaces/IDataSnippet';
import IDetachedResource from '@ulixee/hero-interfaces/IDetachedResource';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';
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
  private cliPromptMessage: string;
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

  // START OF PRIVATE APIS FOR DATASTORE /////////////////////////////////////////////////////////////

  public recordOutput(changes: IOutputChangeToRecord[]): void {
    for (const change of changes as any[]) {
      change.lastCommandId = this.lastCommandId;
    }
    this.commandQueue.record({ command: 'Session.recordOutput', args: changes });
  }

  public async setSnippet(key: string, value: any): Promise<void> {
    await this.commandQueue.run('Session.setSnippet', key, value, Date.now());
  }

  public async getCollectedAssetNames(
    sessionId: string,
  ): Promise<{ resources: string[]; elements: string[]; snippets: string[] }> {
    return await this.commandQueue.run('Session.getCollectedAssetNames', sessionId);
  }

  public async getSnippets(sessionId: string, name: string): Promise<IDataSnippet[]> {
    return await this.commandQueue.run('Session.getSnippets', sessionId, name);
  }

  public async getDetachedElements(sessionId: string, name: string): Promise<IDetachedElement[]> {
    return await this.commandQueue.run('Session.getDetachedElements', sessionId, name);
  }

  public async getDetachedResources(
    sessionId: string,
    name: string,
  ): Promise<IDetachedResource[]> {
    return await this.commandQueue.run('Session.getDetachedResources', sessionId, name);
  }

  // END OF PRIVATE APIS FOR DATASTORE ///////////////////////////////////////////////////////////////

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
        await this.watchRelaunchLogs();
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

  private async watchRelaunchLogs(): Promise<void> {
    await this.addEventListener(null, 'rerun-stdout', msg => process.stdout.write(msg));
    await this.addEventListener(null, 'rerun-stderr', msg => process.stderr.write(msg));
    await this.addEventListener(null, 'rerun-kept-alive', () => {
      // eslint-disable-next-line no-console
      console.log(this.cliPromptMessage);
    });
  }

  private showSessionKeepAlivePrompt(message: string): void {
    this.cliPromptMessage = `\n\n${message}\n\nPress Q or kill the CLI to exit and close Chrome:\n\n`;
    if (/yes|1|true/i.test(process.env.ULX_CLI_NOPROMPT)) return;

    this.cliPrompt = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    readline.emitKeypressEvents(process.stdin);
    process.stdin.setEncoding('utf8');
    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    this.cliPrompt.setPrompt(this.cliPromptMessage);

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
    ShutdownHandler.register(() => this.closeCliPrompt());
    this.cliPrompt.prompt(true);
  }
}
