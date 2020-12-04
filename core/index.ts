import { v1 as uuidv1 } from 'uuid';
import ICoreConfigureOptions from '@secret-agent/core-interfaces/ICoreConfigureOptions';
import ICreateSessionOptions from '@secret-agent/core-interfaces/ICreateSessionOptions';
import {
  ILocationStatus,
  ILocationTrigger,
  LocationTrigger,
} from '@secret-agent/core-interfaces/Location';
import IWaitForResourceOptions from '@secret-agent/core-interfaces/IWaitForResourceOptions';
import { IInteractionGroups } from '@secret-agent/core-interfaces/IInteractions';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import ICore from '@secret-agent/core-interfaces/ICore';
import ISessionMeta from '@secret-agent/core-interfaces/ISessionMeta';
import IWaitForElementOptions from '@secret-agent/core-interfaces/IWaitForElementOptions';
import IExecJsPathResult from '@secret-agent/injected-scripts/interfaces/IExecJsPathResult';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import IAttachedState from '@secret-agent/injected-scripts/interfaces/IAttachedStateCopy';
import Log from '@secret-agent/commons/Logger';
import { createReplayServer } from '@secret-agent/session-state/api';
import ISessionReplayServer from '@secret-agent/session-state/interfaces/ISessionReplayServer';
import Queue from '@secret-agent/commons/Queue';
import Chrome83 from '@secret-agent/emulate-chrome-83';
import IResourceMeta from '@secret-agent/core-interfaces/IResourceMeta';
import ISetCookieOptions from '@secret-agent/core-interfaces/ISetCookieOptions';
import { ICookie } from '@secret-agent/core-interfaces/ICookie';
import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';
import IListenerObject from './interfaces/IListenerObject';
import UserProfile from './lib/UserProfile';
import Session from './lib/Session';
import Tab from './lib/Tab';
import GlobalPool from './lib/GlobalPool';
import IResourceFilterProperties from './interfaces/IResourceFilterProperties';
import BrowserEmulators from './lib/BrowserEmulators';
import Signals = NodeJS.Signals;

const { log } = Log(module);
const shouldStartReplayServer = Boolean(JSON.parse(process.env.SA_SHOW_REPLAY ?? 'true'));

export { GlobalPool, Tab, Session, LocationTrigger };

export default class Core implements ICore {
  public static defaultBrowserEmulatorId = Chrome83.id;
  public static byTabId: { [tabId: string]: Core } = {};
  public static onEventFn: (meta: ISessionMeta, listenerId: string, ...eventArgs: any[]) => void;
  private static wasManuallyStarted = false;
  private static autoShutdownMillis = 2e3;
  private static autoShutdownTimer: NodeJS.Timer;
  private static replayServer?: ISessionReplayServer;
  private static startQueue = new Queue();

  private readonly session: Session;
  private readonly tab: Tab;
  private readonly eventListenersById: { [id: string]: IListenerObject } = {};
  private readonly eventListenerIdsByType: { [name: string]: Set<string> } = {};

  constructor(session: Session, tab: Tab) {
    this.session = session;
    this.tab = tab;
  }

  public get lastCommandId(): number {
    return this.tab.lastCommandId;
  }

  public getResourceProperty<T>(resourceId: number, propertyPath: string): Promise<T> {
    return this.tab.getResourceProperty<T>(resourceId, propertyPath);
  }

  public goto(url: string): Promise<IResourceMeta> {
    return this.tab.runCommand<IResourceMeta>('goto', url);
  }

  public goBack(): Promise<string> {
    return this.tab.runCommand<string>('goBack');
  }

  public goForward(): Promise<string> {
    return this.tab.runCommand<string>('goForward');
  }

  public isElementVisible(jsPath: IJsPath): Promise<boolean> {
    return this.tab.runCommand<boolean>('isElementVisible', jsPath);
  }

  public waitForResource(
    filter: IResourceFilterProperties,
    opts?: IWaitForResourceOptions,
  ): Promise<void> {
    return this.tab.runCommand('waitForResource', filter, opts);
  }

  public async waitForElement(jsPath: IJsPath, opts?: IWaitForElementOptions): Promise<void> {
    await this.tab.runCommand('waitForElement', jsPath, opts);
  }

  public async waitForLoad(status: ILocationStatus): Promise<void> {
    await this.tab.runCommand('waitForLoad', status);
  }

  public async waitForLocation(trigger: ILocationTrigger): Promise<void> {
    await this.tab.runCommand('waitForLocation', trigger);
  }

  public async waitForMillis(millis: number): Promise<void> {
    await this.tab.runCommand('waitForMillis', millis);
  }

  public getJsValue<T = any>(path: string): Promise<{ value: T; type: string }> {
    return this.tab.runCommand('getJsValue', path);
  }

  public execJsPath<T = any>(
    jsPath: IJsPath,
    propertiesToExtract?: string[],
  ): Promise<IExecJsPathResult<T>> {
    return this.tab.runCommand('execJsPath', jsPath, propertiesToExtract);
  }

  public getLocationHref(): Promise<string> {
    return this.tab.runCommand('getLocationHref');
  }

  public async interact(...interactionGroups: IInteractionGroups): Promise<void> {
    await this.tab.runCommand('interact', interactionGroups);
  }

  public getTabCookies(): Promise<ICookie[]> {
    return this.tab.runCommand('getCookies');
  }

  public setTabCookie(name: string, value: string, options?: ISetCookieOptions): Promise<boolean> {
    return this.tab.runCommand('setCookie', name, value, options);
  }

  public removeTabCookie(name: string): Promise<boolean> {
    return this.tab.runCommand('removeCookie', name);
  }

  public exportUserProfile(): Promise<IUserProfile> {
    return UserProfile.export(this.session);
  }

  public fetch(request: IAttachedId | string, init?: IRequestInit): Promise<IAttachedState> {
    return this.tab.runCommand('fetch', request, init);
  }

  public createRequest(input: IAttachedId | string, init?: IRequestInit): Promise<IAttachedState> {
    return this.tab.runCommand('createRequest', input, init);
  }

  public addEventListener(jsPath: IJsPath | null, type: string): Promise<{ listenerId: string }> {
    const id = uuidv1();
    const listener: IListenerObject = { id, type, jsPath };
    this.eventListenersById[id] = listener;
    if (jsPath) {
      if (jsPath[0] === 'resources' && type === 'message') {
        listener.listenFn = this.buildEventIdTrigger.bind(this, id);
        // need to give client time to register function sending events
        setImmediate(
          this.bindWebsocketEvents.bind(this, parseInt(jsPath[1] as string, 10), listener),
        );
      }
    } else if (type) {
      this.eventListenerIdsByType[type] = this.eventListenerIdsByType[type] || new Set();
      this.eventListenerIdsByType[type].add(listener.id);
      if (type === 'resource') {
        this.bindResourceListeners();
      }
    }
    return Promise.resolve({ listenerId: listener.id });
  }

  public removeEventListener(id): Promise<void> {
    const listener = this.eventListenersById[id];
    delete this.eventListenersById[id];
    if (!listener.type) return Promise.resolve(); // ToDo: need to unbind listeners in DOM

    if (listener.type === 'resource') {
      this.bindResourceListeners(false);
    }
    if (listener.jsPath && listener.jsPath[0] === 'resources' && listener.type === 'message') {
      this.tab.sessionState.stopWebsocketMessages(listener.jsPath[1] as string, listener.listenFn);
    }
    if (this.eventListenerIdsByType[listener.type]) {
      this.eventListenerIdsByType[listener.type].delete(listener.id);
      if (!this.eventListenerIdsByType[listener.type].size) {
        delete this.eventListenerIdsByType[listener.type];
      }
    }
    return Promise.resolve();
  }

  public async close(): Promise<void> {
    if (!this.session || this.session.isClosing) return;
    await GlobalPool.closeSession(this.session);
    this.emitEvent('close');
    Core.checkForAutoShutdown();
  }

  public async closeTab(): Promise<void> {
    await this.tab.close();
    if (this.session.tabs.length === 0) {
      await this.close();
    }
  }

  public async focusTab(): Promise<void> {
    await this.tab.runCommand('focus');
  }

  public async waitForNewTab(sinceCommandId?: number): Promise<ISessionMeta> {
    const lastCommandId = sinceCommandId ?? this.lastCommandId;
    const tab = await this.tab.runCommand<Tab>('waitForNewTab', lastCommandId);
    await tab.locationTracker.waitForLocationResourceId();
    return Core.registerSessionTab(this.session, tab);
  }

  private bindResourceListeners(enable = true): void {
    const listenerFn = (...args) => {
      this.emitEvent('resource', ...args);
    };
    if (enable) {
      this.tab.on('resource', listenerFn);
    } else {
      this.tab.off('resource', listenerFn);
    }
  }

  private emitEvent(name: string, ...args): void {
    const listenerIds = this.eventListenerIdsByType[name];
    if (!listenerIds) return;
    for (const listenerId of listenerIds) {
      const sessionMeta: ISessionMeta = {
        sessionId: this.session.id,
        tabId: this.tab.id,
      };
      if (Core.onEventFn) {
        Core.onEventFn(sessionMeta, listenerId, ...args);
      }
    }
  }

  private bindWebsocketEvents(resourceId: number, listener: IListenerObject): void {
    this.tab.sessionState.onWebsocketMessages(resourceId, listener.listenFn);
  }

  private buildEventIdTrigger(id: string, ...args): void {
    const sessionMeta: ISessionMeta = {
      sessionId: this.session.id,
      tabId: this.tab.id,
    };
    if (Core.onEventFn) {
      Core.onEventFn(sessionMeta, id, ...args);
    }
  }

  /////// STATIC /////////////////////////////////////

  public static prewarm(options?: ICoreConfigureOptions): Promise<void> {
    return this.startQueue.run(async () => {
      clearTimeout(this.autoShutdownTimer);
      this.wasManuallyStarted = true;
      if (options) {
        await this.configure(options);
      }
      if (!options?.browserEmulatorIds) {
        await GlobalPool.start([Core.defaultBrowserEmulatorId]);
      }
      if (options?.replayServerPort !== undefined || shouldStartReplayServer) {
        await this.startReplayServer(options.replayServerPort);
      }
    });
  }

  public static async configure(options: ICoreConfigureOptions): Promise<void> {
    const {
      maxConcurrentSessionsCount,
      localProxyPortStart,
      sessionsDir,
      browserEmulatorIds,
    } = options;
    if (maxConcurrentSessionsCount)
      GlobalPool.maxConcurrentSessionsCount = options.maxConcurrentSessionsCount;
    if (localProxyPortStart) GlobalPool.localProxyPortStart = options.localProxyPortStart;
    if (sessionsDir) GlobalPool.sessionsDir = options.sessionsDir;
    if (browserEmulatorIds?.length) await GlobalPool.start(browserEmulatorIds);
  }

  public static getTabsForSession(sessionId: string): Promise<ISessionMeta[]> {
    const session = Session.get(sessionId);
    return Promise.resolve(session.tabs.map(tab => Core.registerSessionTab(session, tab)));
  }

  public static createTab(options: ICreateSessionOptions = {}): Promise<ISessionMeta> {
    return this.startQueue.run(async () => {
      clearTimeout(this.autoShutdownTimer);
      if (!BrowserEmulators.defaultEmulatorId) {
        BrowserEmulators.defaultEmulatorId = Core.defaultBrowserEmulatorId;
      }
      const session = await GlobalPool.createSession(options);
      if (shouldStartReplayServer) {
        await this.startReplayServer();
      }

      const tab = await session.createTab();
      return Core.registerSessionTab(session, tab);
    });
  }

  public static disconnect(tabIds?: string[], fatalError?: Error): Promise<void> {
    if (fatalError) this.logUnhandledError(fatalError, true);
    return this.startQueue.run(async () => {
      const promises: Promise<void>[] = [];
      for (const key of tabIds ?? Object.keys(Core.byTabId)) {
        const core = Core.byTabId[key];
        if (!core) continue;
        delete Core.byTabId[key];
        promises.push(core.close());
      }

      await Promise.all(promises);

      // if nothing open, check for shutdown
      if (tabIds?.length && Object.keys(Core.byTabId).length === 0) {
        this.wasManuallyStarted = false;
        this.checkForAutoShutdown();
      }
    });
  }

  public static logUnhandledError(clientError: Error, fatalError = false): void {
    if (fatalError) {
      log.error('UnhandledError(fatal)', { clientError, sessionId: null });
    } else {
      log.error('UnhandledErrorOrRejection', { clientError, sessionId: null });
    }
  }

  public static async shutdown(force = false): Promise<void> {
    // runs own queue, don't put inside this loop
    await Core.disconnect();
    return this.startQueue.run(async () => {
      log.info('Core.shutdown');
      clearTimeout(Core.autoShutdownTimer);
      const replayServer = this.replayServer;
      this.replayServer = null;
      this.wasManuallyStarted = false;
      await Promise.all([GlobalPool.close(), replayServer?.close(!force)]);
    });
  }

  public static registerSignalHandlers(): void {
    ['exit', 'SIGTERM', 'SIGINT', 'SIGQUIT'].forEach(name => {
      process.once(name as Signals, async () => {
        await Core.shutdown();
        process.exit(0);
      });
    });
  }

  public static registerExceptionHandlers(): void {
    process.on('uncaughtException', async (error: Error) => {
      await Core.logUnhandledError(error, true);
      await Core.shutdown();
      process.exit(1);
    });

    process.on('unhandledRejection', async (error: Error) => {
      await Core.logUnhandledError(error, false);
    });
  }

  public static async startReplayServer(port?: number): Promise<void> {
    if (this.replayServer) return;
    this.replayServer = await createReplayServer(port);
  }

  private static registerSessionTab(session: Session, tab: Tab): ISessionMeta {
    let core = this.byTabId[tab.id];
    if (!core) {
      core = new Core(session, tab);
      this.byTabId[tab.id] = core;
    }
    return {
      sessionId: session.id,
      sessionsDataLocation: session.baseDir,
      tabId: tab.id,
      replayApiServer: this.replayServer?.url,
    } as ISessionMeta;
  }

  private static checkForAutoShutdown(): void {
    clearTimeout(Core.autoShutdownTimer);
    if (Core.wasManuallyStarted || GlobalPool.activeSessionCount > 0) return;

    Core.autoShutdownTimer = setTimeout(Core.shouldShutdown.bind(this), Core.autoShutdownMillis);
  }

  private static shouldShutdown(): void {
    if (Core.wasManuallyStarted || GlobalPool.activeSessionCount > 0) return;

    Core.shutdown().catch(error => {
      log.error('Core.autoShutdown', {
        error,
        sessionId: null,
      });
    });
  }
}

type IAttachedId = number;

Core.registerSignalHandlers();
if (process.env.NODE_ENV !== 'test') Core.registerExceptionHandlers();
