import { createPromise, IResolvablePromise } from '@secret-agent/commons/utils';
import { ILifecycleEvents, IPuppetFrame } from '@secret-agent/puppet/interfaces/IPuppetFrame';
import { URL } from 'url';
import Protocol from 'devtools-protocol';
import * as eventUtils from '@secret-agent/commons/eventUtils';
import {
  CanceledPromiseError,
  IPendingWaitEvent,
  TypedEventEmitter,
} from '@secret-agent/commons/eventUtils';
import { debug } from '@secret-agent/commons/Debug';
import { NavigationReason } from '@secret-agent/core-interfaces/IPage';
import { CDPSession } from './CDPSession';
import ConsoleMessage from './ConsoleMessage';
import { DEFAULT_PAGE, ISOLATED_WORLD } from './FramesManager';
import PageFrame = Protocol.Page.Frame;
import ExecutionContextCreatedEvent = Protocol.Runtime.ExecutionContextCreatedEvent;

const debugWarn = debug('puppet-chrome:frame:warn');
const debugFrame = debug('puppet-chrome:frame');

export default class Frame extends TypedEventEmitter<IFrameEvents> implements IPuppetFrame {
  public get id() {
    return this.internalFrame.id;
  }

  public get name() {
    return this.internalFrame.name ?? '';
  }

  public get parentId() {
    return this.internalFrame.parentId;
  }

  public url: string;

  public get securityOrigin() {
    if (!this.isLoaded || this.url === DEFAULT_PAGE || !this.url) return null;
    const origin = this.internalFrame.securityOrigin;
    if (!origin || origin === '://') {
      return new URL(this.url).origin;
    }
    return origin;
  }

  public get isLoaded() {
    if (!this.activeLoaderId) return true;
    return this.activeLoader.isResolved;
  }

  public navigationReason?: string;
  public disposition?: string;

  public get lifecycleEvents() {
    return this.loaderLifecycles.get(this.activeLoaderId);
  }

  public loaderLifecycles = new Map<string, ILifecycleEvents>();
  private loaderIdResolvers = new Map<string, IResolvablePromise<void>>();
  private activeLoaderId: string;

  private get activeLoader() {
    return this.loaderIdResolvers.get(this.activeLoaderId);
  }

  private defaultContextIds = new Set<number>();
  private isolatedContextIds = new Set<number>();

  private constructor(
    private internalFrame: PageFrame,
    private readonly activeContexts: Set<number>,
    private readonly cdpSession: CDPSession,
    private readonly isAttached: () => boolean,
  ) {
    super();
    this.updateUrl();
    this.setLoader(internalFrame.loaderId);
    if (internalFrame.loaderId && this.url) {
      this.loaderIdResolvers.get(internalFrame.loaderId).resolve();
    }
  }

  public async evaluate<T>(expression: string, isolateFromWebPageEnvironment?: boolean) {
    const contextId = await this.waitForActiveContextId(isolateFromWebPageEnvironment);
    const result = await this.cdpSession.send('Runtime.evaluate', {
      expression,
      contextId,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) {
      throw ConsoleMessage.exceptionToError(result.exceptionDetails);
    }

    const remote = result.result;
    if (remote.objectId) this.cdpSession.disposeRemoteObject(remote);
    return remote.value as T;
  }

  /////// NAVIGATION ///////////////////////////////////////////////////////////////////////////////////////////////////

  public initiateNavigation(url: string, loaderId: string) {
    // chain current listeners to new promise
    this.setLoader(loaderId);
  }

  public requestedNavigation(url: string, reason: NavigationReason, disposition: string) {
    this.navigationReason = reason;
    this.disposition = disposition;

    this.emit('frameRequestedNavigation', { url, reason });
  }

  public onNavigated(frame: PageFrame) {
    this.internalFrame = frame;
    if (this.internalFrame.url) {
      this.url = this.internalFrame.url + (this.internalFrame.urlFragment ?? '');
    }

    if (frame.loaderId) {
      this.loaderIdResolvers.get(frame.loaderId).resolve();
    } else {
      this.activeLoader.resolve();
    }

    this.emit('frameNavigated');
  }

  public onNavigatedWithinDocument(url: string) {
    this.url = url;

    // clear out any active one
    this.activeLoaderId = null;
    this.setLoader('inpage');
    this.loaderIdResolvers.get('inpage').resolve();
    this.emit('frameNavigated', { navigatedInDocument: true });
    this.onStoppedLoading();
  }

  /////// LIFECYCLE ////////////////////////////////////////////////////////////////////////////////////////////////////

  public onStoppedLoading() {
    if (!this.lifecycleEvents.load) {
      this.onLifecycleEvent('DOMContentLoaded');
      this.onLifecycleEvent('load');
    }
  }

  public async waitForLoader(loaderId?: string) {
    await this.loaderIdResolvers.get(loaderId ?? this.activeLoaderId)?.promise;
  }

  public async onLifecycleEvent(name: string, pageLoaderId?: string) {
    const loaderId = pageLoaderId ?? this.activeLoaderId;
    if (name === 'init') {
      if (!this.loaderIdResolvers.has(loaderId)) {
        debugFrame('Queuing new loader', loaderId);
        this.setLoader(loaderId);
      }
    }
    if (name === 'commit') {
      debugFrame('Resolving loader', loaderId);
      this.loaderIdResolvers.get(loaderId)?.resolve();
    }

    if (loaderId) this.loaderLifecycles.get(loaderId)[name] = new Date();
    else this.lifecycleEvents[name] = new Date();

    if (!this.isDefaultPage()) {
      this.emit('frameLifecycle', { name });
    }
  }

  /////// CONTEXT ID  //////////////////////////////////////////////////////////////////////////////////////////////////

  public hasContextId(executionContextId: number) {
    return (
      this.defaultContextIds.has(executionContextId) ||
      this.isolatedContextIds.has(executionContextId)
    );
  }

  public addContextId(executionContextId: number, isDefault: boolean) {
    if (isDefault) {
      this.defaultContextIds.add(executionContextId);
      this.emit('defaultContextCreated', { executionContextId });
    } else {
      this.isolatedContextIds.add(executionContextId);
      this.emit('isolatedContextCreated', { executionContextId });
    }
  }

  public async waitForActiveContextId(isolatedContext = true): Promise<number> {
    if (!this.isAttached()) throw new Error('Execution Context is not available in detached frame');
    if (this.activeLoaderId) {
      await this.loaderIdResolvers.get(this.activeLoaderId).promise;
    }

    const existing = this.getActiveContextId(isolatedContext);
    if (existing) return existing;

    if (isolatedContext) {
      const context = await this.createIsolatedWorld();
      // give one second to set up
      await new Promise(setImmediate);
      return context;
    }

    await this.waitForDefaultContext();

    return this.waitForActiveContextId(isolatedContext);
  }

  public toJSON() {
    return {
      id: this.id,
      parentId: this.parentId,
      name: this.name,
      url: this.url,
      navigationReason: this.navigationReason,
      disposition: this.disposition,
    };
  }

  private setLoader(loaderId: string) {
    if (!loaderId) return;
    if (loaderId === this.activeLoaderId) return;
    this.loaderLifecycles.set(loaderId, {});
    this.activeLoaderId = loaderId;
    const newResolver = createPromise();
    if (loaderId !== 'inpage') {
      const promise = newResolver.promise;
      newResolver.promise = this.createIsolatedWorld().then(promise as any);
      if (!this.getActiveContextId(false)) {
        newResolver.promise = this.waitForDefaultContext().then(newResolver.promise as any);
      }
    }

    this.loaderIdResolvers.set(loaderId, newResolver);
  }

  private async createIsolatedWorld() {
    try {
      if (!this.isAttached()) return;
      const isolatedWorld = await this.cdpSession.send('Page.createIsolatedWorld', {
        frameId: this.id,
        worldName: ISOLATED_WORLD,
        // param is misspelled in protocol
        grantUniveralAccess: true,
      });
      const { executionContextId } = isolatedWorld;
      this.activeContexts.add(executionContextId);
      this.addContextId(executionContextId, false);
      return executionContextId;
    } catch (err) {
      debugWarn('Failed to create isolated world.', err);
    }
  }

  private async waitForDefaultContext() {
    return this.waitOn('defaultContextCreated').catch(err => {
      if (err instanceof CanceledPromiseError) return;
      throw err;
    });
  }

  private isDefaultPage() {
    return !this.url || this.url === DEFAULT_PAGE;
  }

  private getActiveContextId(isolatedContext: boolean) {
    if (isolatedContext) {
      for (const id of this.isolatedContextIds) {
        if (this.activeContexts.has(id)) return id;
      }
    } else {
      for (const id of this.defaultContextIds) {
        if (this.activeContexts.has(id)) return id;
      }
    }
  }

  private updateUrl() {
    if (this.internalFrame.url) {
      this.url = this.internalFrame.url + (this.internalFrame.urlFragment ?? '');
    }
  }

  public static create(
    internalFrame: PageFrame,
    activeContexts: Set<number>,
    cdpSession: CDPSession,
    isAttached: () => boolean,
  ) {
    const frame = new Frame(internalFrame, activeContexts, cdpSession, isAttached);
    frame.createIsolatedWorld().catch(debugWarn);
    return frame;
  }
}

interface IFrameEvents {
  defaultContextCreated: { executionContextId: number };
  isolatedContextCreated: { executionContextId: number };
  frameLifecycle: { name: string };
  frameNavigated: { navigatedInDocument?: boolean };
  frameRequestedNavigation: { url: string; reason: NavigationReason };
}
