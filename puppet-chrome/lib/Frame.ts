import { createPromise } from '@secret-agent/commons/utils';
import {
  ILifecycleEvents,
  IPuppetFrame,
  IPuppetFrameEvents,
} from '@secret-agent/core-interfaces/IPuppetFrame';
import { URL } from 'url';
import Protocol from 'devtools-protocol';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import { NavigationReason } from '@secret-agent/core-interfaces/INavigation';
import { IBoundLog } from '@secret-agent/core-interfaces/ILog';
import IResolvablePromise from '@secret-agent/core-interfaces/IResolvablePromise';
import Resolvable from '@secret-agent/commons/Resolvable';
import ProtocolError from './ProtocolError';
import { DevtoolsSession } from './DevtoolsSession';
import ConsoleMessage from './ConsoleMessage';
import { DEFAULT_PAGE, ISOLATED_WORLD } from './FramesManager';
import PageFrame = Protocol.Page.Frame;

const ContextNotFoundCode = -32000;

export default class Frame extends TypedEventEmitter<IPuppetFrameEvents> implements IPuppetFrame {
  public get id(): string {
    return this.internalFrame.id;
  }

  public get name(): string {
    return this.internalFrame.name ?? '';
  }

  public get parentId(): string {
    return this.internalFrame.parentId;
  }

  public url: string;

  public get isDefaultUrl(): boolean {
    return !this.url || this.url === ':' || this.url === DEFAULT_PAGE;
  }

  public get securityOrigin(): string {
    if (!this.isLoaded || this.isDefaultUrl) return '';
    let origin = this.internalFrame.securityOrigin;
    if (!origin || origin === '://') {
      this.internalFrame.securityOrigin = new URL(this.url).origin;
      origin = this.internalFrame.securityOrigin;
    }
    return origin;
  }

  public get isLoaded(): boolean {
    if (!this.activeLoaderId) return true;
    return this.activeLoader.isResolved;
  }

  public navigationReason?: string;

  public disposition?: string;
  public get lifecycleEvents(): ILifecycleEvents {
    return this.loaderLifecycles.get(this.activeLoaderId);
  }

  public readonly isAttached: () => boolean;
  public loaderLifecycles = new Map<string, ILifecycleEvents>();
  public activeLoaderId: string;

  protected readonly logger: IBoundLog;
  private isolatedWorldElementObjectId?: string;
  private readonly parentFrame: Frame | null;
  private loaderIdResolvers = new Map<string, IResolvablePromise<Error | null>>();
  private readonly devtoolsSession: DevtoolsSession;

  private get activeLoader(): IResolvablePromise<Error | null> {
    return this.loaderIdResolvers.get(this.activeLoaderId);
  }

  private defaultContextId: number;
  private isolatedContextId: number;
  private readonly activeContextIds: Set<number>;
  private internalFrame: PageFrame;
  private closedWithError: Error;
  private defaultContextCreated: Resolvable<void>;

  constructor(
    internalFrame: PageFrame,
    activeContextIds: Set<number>,
    devtoolsSession: DevtoolsSession,
    logger: IBoundLog,
    isAttached: () => boolean,
    parentFrame: Frame | null,
  ) {
    super();
    this.activeContextIds = activeContextIds;
    this.devtoolsSession = devtoolsSession;
    this.logger = logger.createChild(module);
    this.parentFrame = parentFrame;
    this.isAttached = isAttached;
    this.setEventsToLog(['frame-requested-navigation', 'frame-navigated', 'frame-lifecycle']);
    this.storeEventsWithoutListeners = true;
    this.onLoaded(internalFrame);
  }

  public close(error: Error) {
    this.cancelPendingEvents('Frame closed');
    error ??= new CanceledPromiseError('Frame closed');
    this.activeLoader.resolve(error);
    this.defaultContextCreated?.reject(error);
    this.closedWithError = error;
  }

  public async evaluate<T>(
    expression: string,
    isolateFromWebPageEnvironment?: boolean,
    options?: { shouldAwaitExpression?: boolean; retriesWaitingForLoad?: number },
  ): Promise<T> {
    if (this.closedWithError) throw this.closedWithError;
    const startOrigin = this.securityOrigin;
    const contextId = await this.waitForActiveContextId(isolateFromWebPageEnvironment);
    try {
      const result: Protocol.Runtime.EvaluateResponse = await this.devtoolsSession.send(
        'Runtime.evaluate',
        {
          expression,
          contextId,
          returnByValue: true,
          awaitPromise: options?.shouldAwaitExpression ?? true,
        },
        this,
      );

      if (result.exceptionDetails) {
        throw ConsoleMessage.exceptionToError(result.exceptionDetails);
      }

      const remote = result.result;
      if (remote.objectId) this.devtoolsSession.disposeRemoteObject(remote);
      return remote.value as T;
    } catch (err) {
      let retries = options?.retriesWaitingForLoad ?? 0;
      // if we had a context id from a blank page, try again
      if (!startOrigin && this.getActiveContextId(isolateFromWebPageEnvironment) !== contextId) {
        retries += 1;
      }
      const isNotFoundError =
        err.code === ContextNotFoundCode ||
        (err as ProtocolError).remoteError?.code === ContextNotFoundCode;
      if (isNotFoundError && retries > 0) {
        // Cannot find context with specified id (ie, could be reloading or unloading)
        return this.evaluate(expression, isolateFromWebPageEnvironment, {
          shouldAwaitExpression: options?.shouldAwaitExpression,
          retriesWaitingForLoad: retries - 1,
        });
      }
      throw err;
    }
  }

  public async evaluateOnIsolatedFrameElement<T>(expression: string): Promise<T> {
    if (this.closedWithError) throw this.closedWithError;
    const objectId = await this.getParentElementId();
    if (!objectId) return;
    try {
      const result = await this.devtoolsSession.send('Runtime.callFunctionOn', {
        functionDeclaration: `function executeRemoteFn() {
        return ${expression};
      }`,
        returnByValue: true,
        objectId,
      });
      if (result.exceptionDetails) {
        throw ConsoleMessage.exceptionToError(result.exceptionDetails);
      }

      const remote = result.result;
      if (remote.objectId) this.devtoolsSession.disposeRemoteObject(remote);
      return remote.value as T;
    } catch (err) {
      if (err instanceof CanceledPromiseError) return;
      throw err;
    }
  }

  /////// NAVIGATION ///////////////////////////////////////////////////////////////////////////////////////////////////

  public initiateNavigation(url: string, loaderId: string): void {
    // chain current listeners to new promise
    this.setLoader(loaderId);
  }

  public requestedNavigation(url: string, reason: NavigationReason, disposition: string): void {
    this.navigationReason = reason;
    this.disposition = disposition;

    this.emit('frame-requested-navigation', { frame: this, url, reason });
  }

  public onLoaded(internalFrame: PageFrame): void {
    this.internalFrame = internalFrame;
    this.updateUrl();
    this.setLoader(internalFrame.loaderId);
    if (internalFrame.loaderId && this.url) {
      this.loaderIdResolvers.get(internalFrame.loaderId).resolve();
    }
    if (internalFrame.loaderId && internalFrame.unreachableUrl) {
      // if this is a loaded frame, just count it as loaded. it shouldn't fail
      this.loaderIdResolvers.get(internalFrame.loaderId).resolve();
    }
  }

  public onNavigated(frame: PageFrame): void {
    this.internalFrame = frame;
    this.updateUrl();

    let loader = this.activeLoader;
    if (frame.loaderId && frame.loaderId !== this.activeLoaderId) {
      loader = this.loaderIdResolvers.get(frame.loaderId) ?? this.activeLoader;
    }
    if (frame.unreachableUrl) {
      loader.resolve(new Error(`Unreachable url for navigation "${frame.unreachableUrl}"`));
    } else {
      loader.resolve();
    }

    this.emit('frame-navigated', { frame: this });
  }

  public onNavigatedWithinDocument(url: string): void {
    if (this.url === url && this.activeLoader?.isResolved) return;
    this.url = url;

    // clear out any active one
    this.activeLoaderId = null;
    this.setLoader('inpage');
    this.loaderIdResolvers.get('inpage').resolve();
    this.onStoppedLoading();
    this.emit('frame-navigated', { frame: this, navigatedInDocument: true });
  }

  /////// LIFECYCLE ////////////////////////////////////////////////////////////////////////////////////////////////////

  public onStoppedLoading(): void {
    if (!this.lifecycleEvents.load) {
      this.onLifecycleEvent('DOMContentLoaded');
      this.onLifecycleEvent('load');
    }
  }

  public async waitForLoader(loaderId?: string): Promise<Error | null> {
    const hasLoaderError = await this.loaderIdResolvers.get(loaderId ?? this.activeLoaderId)
      ?.promise;
    if (hasLoaderError) return hasLoaderError;

    if (!this.getActiveContextId(false)) {
      await this.waitForDefaultContext();
    }
  }

  public onLifecycleEvent(name: string, pageLoaderId?: string): void {
    const loaderId = pageLoaderId ?? this.activeLoaderId;
    if (name === 'init') {
      if (!this.loaderIdResolvers.has(loaderId)) {
        this.logger.info('Queuing new loader', {
          loaderId,
          frameId: this.id,
        });
        this.setLoader(loaderId);
      }
    }

    if (
      (name === 'commit' || name === 'DOMContentLoaded' || name === 'load') &&
      !this.loaderIdResolvers.get(loaderId)?.isResolved
    ) {
      this.logger.info('Resolving loader', {
        loaderId,
        frameId: this.id,
      });

      if (!this.loaderIdResolvers.has(loaderId)) {
        this.setLoader(loaderId);
      }
      this.loaderIdResolvers.get(loaderId)?.resolve();
    }

    const lifecycle = this.loaderLifecycles.get(loaderId);

    if (lifecycle) {
      lifecycle[name] = new Date();
    }

    if (!this.isDefaultUrl) {
      this.emit('frame-lifecycle', { frame: this, name, loaderId: pageLoaderId });
    }
  }

  /////// CONTEXT ID  //////////////////////////////////////////////////////////////////////////////////////////////////

  public hasContextId(executionContextId: number): boolean {
    return (
      this.defaultContextId === executionContextId || this.isolatedContextId === executionContextId
    );
  }

  public removeContextId(executionContextId: number): void {
    if (this.defaultContextId === executionContextId) this.defaultContextId = null;
    if (this.isolatedContextId === executionContextId) this.defaultContextId = null;
  }

  public clearContextIds(): void {
    this.defaultContextId = null;
    this.defaultContextId = null;
  }

  public addContextId(executionContextId: number, isDefault: boolean): void {
    if (isDefault) {
      this.defaultContextId = executionContextId;
      this.defaultContextCreated?.resolve();
    } else {
      this.isolatedContextId = executionContextId;
    }
  }

  public getActiveContextId(isolatedContext: boolean): number | undefined {
    let id: number;
    if (isolatedContext) {
      id = this.isolatedContextId;
    } else {
      id = this.defaultContextId;
    }
    if (id && this.activeContextIds.has(id)) return id;
  }

  public async waitForActiveContextId(isolatedContext = true): Promise<number> {
    if (!this.isAttached()) throw new Error('Execution Context is not available in detached frame');

    const existing = this.getActiveContextId(isolatedContext);
    if (existing) return existing;

    if (isolatedContext) {
      const context = await this.createIsolatedWorld();
      // give one task to set up
      await new Promise(setImmediate);
      return context;
    }

    await this.waitForDefaultContext();
    return this.getActiveContextId(isolatedContext);
  }

  public canEvaluate(isolatedFromWebPageEnvironment: boolean): boolean {
    return this.getActiveContextId(isolatedFromWebPageEnvironment) !== undefined;
  }

  public toJSON() {
    return {
      id: this.id,
      parentId: this.parentId,
      activeLoaderId: this.activeLoaderId,
      name: this.name,
      url: this.url,
      navigationReason: this.navigationReason,
      disposition: this.disposition,
      isLoaderResolved: this.activeLoader?.isResolved,
      lifecycle: this.lifecycleEvents,
    };
  }

  public async waitForLoad(): Promise<void> {
    if (this.lifecycleEvents.load) return;
    await this.waitOn('frame-lifecycle', x => x.name === 'load', 30e3);
  }

  private setLoader(loaderId: string): void {
    if (!loaderId) return;
    if (loaderId === this.activeLoaderId) return;
    if (loaderId === 'inpage' || !this.loaderIdResolvers.has(loaderId)) {
      this.loaderLifecycles.set(loaderId, {});
      const newResolver = createPromise();

      if (this.activeLoader && !this.activeLoader.isResolved) {
        this.activeLoader.resolve(newResolver.promise);
      }

      this.loaderIdResolvers.set(loaderId, newResolver);
    }
    this.activeLoaderId = loaderId;
  }

  private async createIsolatedWorld(): Promise<number> {
    try {
      if (!this.isAttached()) return;
      const isolatedWorld = await this.devtoolsSession.send(
        'Page.createIsolatedWorld',
        {
          frameId: this.id,
          worldName: ISOLATED_WORLD,
          // param is misspelled in protocol
          grantUniveralAccess: true,
        },
        this,
      );
      const { executionContextId } = isolatedWorld;
      if (!this.activeContextIds.has(executionContextId)) {
        this.activeContextIds.add(executionContextId);
        this.addContextId(executionContextId, false);
        this.getParentElementId().catch(() => null);
      }

      return executionContextId;
    } catch (error) {
      if (error instanceof CanceledPromiseError) {
        return;
      }
      if (error instanceof ProtocolError) {
        // 32000 code means frame doesn't exist, see if we just missed timing
        if (error.remoteError?.code === ContextNotFoundCode) {
          if (!this.isAttached()) return;
        }
      }
      this.logger.warn('Failed to create isolated world.', {
        frameId: this.id,
        error,
      });
    }
  }

  private async getParentElementId(): Promise<string> {
    try {
      if (!this.parentFrame || this.isolatedWorldElementObjectId)
        return this.isolatedWorldElementObjectId;
      const owner = await this.devtoolsSession.send('DOM.getFrameOwner', { frameId: this.id });
      const resolved = await this.devtoolsSession.send('DOM.resolveNode', {
        backendNodeId: owner.backendNodeId,
        executionContextId: this.parentFrame.getActiveContextId(true),
        nodeId: owner.nodeId,
      });
      this.isolatedWorldElementObjectId = resolved.object.objectId;
      // don't dispose... will cleanup frame
      return this.isolatedWorldElementObjectId;
    } catch (error) {
      // ignore errors looking this up
      this.logger.info('Failed to lookup isolated node', {
        frameId: this.id,
        error,
      });
    }
  }

  private async waitForDefaultContext(): Promise<void> {
    if (this.getActiveContextId(false)) return;

    this.defaultContextCreated = new Resolvable<void>();
    // don't time out this event, we'll just wait for the page to shut down
    await this.defaultContextCreated.promise.catch(err => {
      if (err instanceof CanceledPromiseError) return;
      throw err;
    });
  }

  private updateUrl(): void {
    if (this.internalFrame.url) {
      this.url = this.internalFrame.url + (this.internalFrame.urlFragment ?? '');
    }
  }
}
