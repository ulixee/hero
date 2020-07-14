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
import Signals = NodeJS.Signals;

export { GlobalPool, Window, Session, LocationTrigger };

interface IListenerObject {
  id: string;
  type?: string;
  jsPath?: IJsPath;
  listenFn?: (...args) => void;
}

export default class Core implements ICore {
  public static byWindowId: { [windowId: string]: Core } = {};
  public static onEventFn: (meta: ISessionMeta, listenerId: string, ...eventArgs: any[]) => void;
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
    return await UserProfile.export(this.window.devtoolsClient, origins);
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
    if (options) await this.configure(options);
    await GlobalPool.start();
  }

  public static async configure(options: IConfigureOptions) {
    const { maxActiveSessionCount, localProxyPortStart, sessionsDir } = options;
    if (maxActiveSessionCount) GlobalPool.maxActiveSessionCount = options.maxActiveSessionCount;
    if (localProxyPortStart) GlobalPool.localProxyPortStart = options.localProxyPortStart;
    if (sessionsDir) GlobalPool.sessionsDir = options.sessionsDir;
  }

  public static async createSession(options: ICreateSessionOptions = {}) {
    const session = await GlobalPool.createSession(options);
    const window = session.window;
    this.byWindowId[window.id] = new Core(session);
    return { sessionId: session.id, sessionsDataLocation: session.baseDir, windowId: window.id };
  }

  public static async closeSessions(windowIds?: string[]) {
    const toClose = windowIds?.length
      ? windowIds.map(x => Core.byWindowId[x])
      : Object.values(Core.byWindowId);
    await Promise.all(toClose.map(x => x?.close()));
  }

  public static async shutdown() {
    await Core.closeSessions();
    await GlobalPool.close();
  }
}

['SIGTERM', 'SIGINT', 'SIGQUIT'].forEach(name => {
  process.once(name as Signals, async () => {
    await Core.shutdown();
    process.exit(0);
  });
});

type IAttachedId = number;
