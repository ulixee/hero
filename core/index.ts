import { v1 as uuidv1 } from 'uuid';
import GlobalPool from './lib/GlobalPool';
import Window from './lib/Window';
import Session from './lib/Session';
import IConfigureOptions from '@secret-agent/core-interfaces/IConfigureOptions';
import ICreateSessionOptions from '@secret-agent/core-interfaces/ICreateSessionOptions';
import {
  ILocationStatus,
  ILocationTrigger,
  LocationTrigger,
} from '@secret-agent/core-interfaces/Location';
import IWaitForResourceOptions from '@secret-agent/core-interfaces/IWaitForResourceOptions';
import ISessionOptions from '@secret-agent/core-interfaces/ISessionOptions';
import { IInteractionGroups } from '@secret-agent/core-interfaces/IInteractions';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import ICore from '@secret-agent/core-interfaces/ICore';
import ISessionMeta from '@secret-agent/core-interfaces/ISessionMeta';
import IWaitForElementOptions from '@secret-agent/core-interfaces/IWaitForElementOptions';
import IWaitForResourceFilter from '@secret-agent/core-interfaces/IWaitForResourceFilter';
import UserProfile from './lib/UserProfile';
import IExecJsPathResult from '@secret-agent/injected-scripts/interfaces/IExecJsPathResult';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import IAttachedState from '@secret-agent/injected-scripts/interfaces/IAttachedStateCopy';
import Log from '@secret-agent/commons/Logger';
import { createReplayServer } from '@secret-agent/session-state/api';
import ISessionReplayServer from '@secret-agent/session-state/interfaces/ISessionReplayServer';
import Signals = NodeJS.Signals;
import Queue from '@secret-agent/commons/Queue';
import IListenerObject from './interfaces/IListenerObject';
import Chrome83 from '@secret-agent/emulate-chrome-83';
import Emulators from '@secret-agent/emulators';

const { log } = Log(module);
const shouldStartReplayServer = Boolean(JSON.parse(process.env.SA_SHOW_REPLAY ?? 'true'));

export { GlobalPool, Window, Session, LocationTrigger };

export default class Core implements ICore {
  public static defaultEmulatorId = Chrome83.emulatorId;
  public static byWindowId: { [windowId: string]: Core } = {};
  public static onEventFn: (meta: ISessionMeta, listenerId: string, ...eventArgs: any[]) => void;
  private static wasManuallyStarted = false;
  private static autoShutdownMillis = 2e3;
  private static autoShutdownTimer: NodeJS.Timer;
  private static replayServer?: ISessionReplayServer;
  private static startQueue = new Queue();
  private readonly session: Session;
  private readonly window: Window;
  private readonly eventListenersById: { [id: string]: IListenerObject } = {};
  private readonly eventListenerIdsByType: { [name: string]: Set<string> } = {};
  private isClosing: boolean = false;

  constructor(session: Session) {
    this.session = session;
    this.window = session.window;
  }

  public get lastCommandId() {
    return this.window.lastCommandId;
  }

  public async getResourceProperty(resourceId: number, propertyPath: string) {
    return this.window.getResourceProperty(resourceId, propertyPath);
  }

  public async goto(url: string) {
    return this.window.runCommand<void>('goto', url);
  }

  public async waitForResource(
    filter: Pick<IWaitForResourceFilter, 'url' | 'type'>,
    opts?: IWaitForResourceOptions,
  ) {
    return await this.window.runCommand('waitForResource', filter, opts);
  }

  public async waitForElement(jsPath: IJsPath, opts?: IWaitForElementOptions) {
    await this.window.runCommand('waitForElement', jsPath, opts);
  }

  public async waitForLoad(status: ILocationStatus) {
    await this.window.runCommand('waitForLoad', status);
  }

  public async waitForLocation(trigger: ILocationTrigger) {
    await this.window.runCommand('waitForLocation', trigger);
  }

  public async waitForMillis(millis: number) {
    await this.window.runCommand('waitForMillis', millis);
  }

  public async getJsValue<T = any>(path: string) {
    return this.window.runCommand<{ value: T; type: string }>('getJsValue', path);
  }

  public async execJsPath<T = any>(
    jsPath: IJsPath,
    propertiesToExtract?: string[],
  ): Promise<IExecJsPathResult<T>> {
    return this.window.runCommand<IExecJsPathResult<T>>('execJsPath', jsPath, propertiesToExtract);
  }

  public async getLocationHref() {
    return this.window.runCommand<string>('getLocationHref');
  }

  public async interact(...interactionGroups: IInteractionGroups) {
    await this.window.runCommand('interact', interactionGroups);
  }

  public async getPageCookies() {
    return await this.window.runCommand('getPageCookies');
  }

  public async getUserCookies() {
    return await UserProfile.getAllCookies(this.window.devtoolsClient);
  }

  public async exportUserProfile() {
    const origins = this.window.frameTracker.getSecurityOrigins(UserProfile.installedWorld);
    return await UserProfile.export(this.session.id, this.window.devtoolsClient, origins);
  }

  public async fetch(request: IAttachedId | string, init?: IRequestInit): Promise<IAttachedState> {
    return this.window.runCommand<IAttachedState>('fetch', request, init);
  }

  public async createRequest(
    input: IAttachedId | string,
    init?: IRequestInit,
  ): Promise<IAttachedState> {
    return this.window.runCommand<IAttachedState>('createRequest', input, init);
  }

  public async configure(options: ISessionOptions) {
    // ToDo: needs implementation
  }

  public async addEventListener(jsPath: IJsPath | null, type: string, options?: any) {
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
    return { listenerId: listener.id };
  }

  public async removeEventListener(id) {
    const listener = this.eventListenersById[id];
    delete this.eventListenersById[id];
    if (!listener.type) return; // ToDo: need to unbind listeners in DOM

    if (listener.type === 'resource') {
      this.bindResourceListeners(false);
    }
    if (listener.jsPath && listener.jsPath[0] === 'resources' && listener.type === 'message') {
      this.window.sessionState.stopWebsocketMessages(
        listener.jsPath[1] as string,
        listener.listenFn,
      );
    }
    if (this.eventListenerIdsByType[listener.type]) {
      this.eventListenerIdsByType[listener.type].delete(listener.id);
      if (!this.eventListenerIdsByType[listener.type].size) {
        delete this.eventListenerIdsByType[listener.type];
      }
    }
  }

  public async close() {
    if (this.isClosing) return;
    this.isClosing = true;
    await GlobalPool.closeSession(this.session);
    this.emitEvent('close');
    Core.checkForAutoShutdown();
  }

  private bindResourceListeners(enable: boolean = true) {
    const listenerFn = (...args) => {
      this.emitEvent('resource', ...args);
    };
    if (enable) {
      this.window.sessionState.emitter.on('resource', listenerFn);
    } else {
      this.window.sessionState.emitter.off('resource', listenerFn);
    }
  }

  private emitEvent(name: string, ...args) {
    const listenerIds = this.eventListenerIdsByType[name];
    if (!listenerIds) return;
    for (const listenerId of listenerIds) {
      const sessionMeta: ISessionMeta = {
        sessionId: this.session.id,
        windowId: this.window.id,
      };
      if (Core.onEventFn) {
        Core.onEventFn(sessionMeta, listenerId, ...args);
      }
    }
  }

  private bindWebsocketEvents(resourceId: number, listener: IListenerObject) {
    this.window.sessionState.onWebsocketMessages(resourceId, listener.listenFn);
  }

  private buildEventIdTrigger(id: string, ...args) {
    const sessionMeta: ISessionMeta = {
      sessionId: this.session.id,
      windowId: this.window.id,
    };
    if (Core.onEventFn) {
      Core.onEventFn(sessionMeta, id, ...args);
    }
  }

  // STATIC /////////////////////////////////////

  public static async start(options?: IConfigureOptions) {
    return this.startQueue.run(async () => {
      clearTimeout(this.autoShutdownTimer);
      this.wasManuallyStarted = true;
      if (options) {
        await this.configure(options);
      }
      if (!options?.activeEmulatorIds) {
        await GlobalPool.start([Core.defaultEmulatorId]);
      }
      if (options?.replayServerPort !== undefined || shouldStartReplayServer) {
        await this.startReplayServer(options.replayServerPort);
      }
    });
  }

  public static async configure(options: IConfigureOptions) {
    const { maxActiveSessionCount, localProxyPortStart, sessionsDir, activeEmulatorIds } = options;
    if (maxActiveSessionCount) GlobalPool.maxActiveSessionCount = options.maxActiveSessionCount;
    if (localProxyPortStart) GlobalPool.localProxyPortStart = options.localProxyPortStart;
    if (sessionsDir) GlobalPool.sessionsDir = options.sessionsDir;
    if (activeEmulatorIds?.length) await GlobalPool.start(activeEmulatorIds);
  }

  public static async createSession(options: ICreateSessionOptions = {}) {
    return this.startQueue.run(async () => {
      clearTimeout(this.autoShutdownTimer);
      if (!Emulators.defaultEmulatorId) Emulators.defaultEmulatorId = Core.defaultEmulatorId;
      const session = await GlobalPool.createSession(options);
      if (shouldStartReplayServer) {
        await this.startReplayServer();
      }
      const window = session.window;
      this.byWindowId[window.id] = new Core(session);
      return {
        sessionId: session.id,
        sessionsDataLocation: session.baseDir,
        windowId: window.id,
        replayApiServer: this.replayServer?.url,
      };
    });
  }

  public static async disconnect(windowIds?: string[], clientError?: Error) {
    return this.startQueue.run(async () => {
      if (clientError) log.error('UnhandledClientError', { clientError, sessionId: null });

      const promises: Promise<void>[] = [];
      for (const key of windowIds ?? Object.keys(Core.byWindowId)) {
        const core = Core.byWindowId[key];
        delete Core.byWindowId[key];
        promises.push(core.close());
      }

      await Promise.all(promises);

      // if nothing open, check for shutdown
      if (windowIds?.length && Object.keys(Core.byWindowId).length === 0) {
        this.wasManuallyStarted = false;
        this.checkForAutoShutdown();
      }
    });
  }

  public static async shutdown(fatalError?: Error, force = false) {
    // runs own queue, don't put inside this loop
    await Core.disconnect(null, fatalError);
    return this.startQueue.run(async () => {
      log.info('Core.shutdown');
      clearTimeout(Core.autoShutdownTimer);
      const replayServer = this.replayServer;
      this.replayServer = null;
      this.wasManuallyStarted = false;
      return Promise.all([GlobalPool.close(), replayServer?.close(!force)]);
    });
  }

  public static registerSignalHandlers() {
    ['SIGTERM', 'SIGINT', 'SIGQUIT'].forEach(name => {
      process.once(name as Signals, async () => {
        await Core.shutdown();
        process.exit(0);
      });
    });

    process.on('uncaughtException', async (error: Error) => {
      await Core.shutdown(error);
      process.exit(1);
    });

    process.on('unhandledRejection', async (error: Error) => {
      await Core.shutdown(error);
    });
  }

  public static async startReplayServer(port?: number) {
    if (this.replayServer) return;
    this.replayServer = await createReplayServer(port);
  }

  private static checkForAutoShutdown() {
    clearTimeout(Core.autoShutdownTimer);
    if (Core.wasManuallyStarted || GlobalPool.activeSessionCount > 0) return;

    Core.autoShutdownTimer = setTimeout(Core.shouldShutdown.bind(this), Core.autoShutdownMillis);
  }

  private static shouldShutdown() {
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

if (process.env.NODE_ENV !== 'test') Core.registerSignalHandlers();
