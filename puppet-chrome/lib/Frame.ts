import {
  ILifecycleEvents,
  IPuppetFrame,
  IPuppetFrameEvents,
} from '@ulixee/hero-interfaces/IPuppetFrame';
import { URL } from 'url';
import Protocol from 'devtools-protocol';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import { NavigationReason } from '@ulixee/hero-interfaces/INavigation';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import ProtocolError from './ProtocolError';
import { DevtoolsSession } from './DevtoolsSession';
import ConsoleMessage from './ConsoleMessage';
import { DEFAULT_PAGE, ISOLATED_WORLD } from './FramesManager';
import { NavigationLoader } from './NavigationLoader';
import PageFrame = Protocol.Page.Frame;

const ContextNotFoundCode = -32000;
const InPageNavigationLoaderPrefix = 'inpage';

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
    if (!this.activeLoader?.isNavigationComplete || this.isDefaultUrl) return '';
    let origin = this.internalFrame.securityOrigin;
    if (!origin || origin === '://') {
      if (this.url.startsWith('about:')) return '';
      this.internalFrame.securityOrigin = new URL(this.url).origin;
      origin = this.internalFrame.securityOrigin ?? '';
    }
    return origin;
  }

  public navigationReason?: string;

  public disposition?: string;

  public get isAttached(): boolean {
    return this.checkIfAttached();
  }

  public get activeLoader(): NavigationLoader {
    return this.navigationLoadersById[this.activeLoaderId];
  }

  public activeLoaderId: string;
  public navigationLoadersById: { [loaderId: string]: NavigationLoader } = {};

  protected readonly logger: IBoundLog;
  private isolatedWorldElementObjectId?: string;
  private readonly parentFrame: Frame | null;
  private readonly devtoolsSession: DevtoolsSession;

  private defaultLoaderId: string;
  private startedLoaderId: string;

  private defaultContextId: number;
  private isolatedContextId: number;
  private readonly activeContextIds: Set<number>;
  private internalFrame: PageFrame;
  private closedWithError: Error;
  private defaultContextCreated: Resolvable<void>;
  private readonly checkIfAttached: () => boolean;
  private inPageCounter = 0;

  constructor(
    internalFrame: PageFrame,
    activeContextIds: Set<number>,
    devtoolsSession: DevtoolsSession,
    logger: IBoundLog,
    checkIfAttached: () => boolean,
    parentFrame: Frame | null,
  ) {
    super();
    this.activeContextIds = activeContextIds;
    this.devtoolsSession = devtoolsSession;
    this.logger = logger.createChild(module);
    this.parentFrame = parentFrame;
    this.checkIfAttached = checkIfAttached;
    this.setEventsToLog(['frame-requested-navigation', 'frame-navigated', 'frame-lifecycle']);
    this.storeEventsWithoutListeners = true;
    this.onAttached(internalFrame);
  }

  public close(error: Error): void {
    this.cancelPendingEvents('Frame closed');
    error ??= new CanceledPromiseError('Frame closed');
    this.activeLoader.setNavigationResult(error);
    this.defaultContextCreated?.reject(error);
    this.closedWithError = error;
  }

  public async evaluate<T>(
    expression: string,
    isolateFromWebPageEnvironment?: boolean,
    options?: { shouldAwaitExpression?: boolean; retriesWaitingForLoad?: number },
  ): Promise<T> {
    if (this.closedWithError) throw this.closedWithError;
    const startUrl = this.url;
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
      if (
        (!startOrigin || this.url !== startUrl) &&
        this.getActiveContextId(isolateFromWebPageEnvironment) !== contextId
      ) {
        retries += 1;
      }
      const isNotFoundError =
        err.code === ContextNotFoundCode ||
        (err as ProtocolError).remoteError?.code === ContextNotFoundCode;
      if (isNotFoundError) {
        if (retries > 0) {
          // Cannot find context with specified id (ie, could be reloading or unloading)
          return this.evaluate(expression, isolateFromWebPageEnvironment, {
            shouldAwaitExpression: options?.shouldAwaitExpression,
            retriesWaitingForLoad: retries - 1,
          });
        }
        throw new CanceledPromiseError('The page context to evaluate javascript was not found');
      }
      throw err;
    }
  }

  public html(): Promise<string> {
    return this.evaluate(
      `(() => {
  let retVal = '';
  if (document.doctype)
    retVal = new XMLSerializer().serializeToString(document.doctype);
  if (document.documentElement)
    retVal += document.documentElement.outerHTML;
  return retVal;
})()`,
      true,
      { shouldAwaitExpression: false, retriesWaitingForLoad: 1 },
    );
  }

  public async waitForLifecycleEvent(
    event: keyof ILifecycleEvents = 'load',
    loaderId?: string,
    timeoutMs = 30e3,
  ): Promise<void> {
    event ??= 'load';
    timeoutMs ??= 30e3;
    await this.waitForLoader(loaderId, timeoutMs);

    const loader = this.navigationLoadersById[loaderId ?? this.activeLoaderId];
    if (loader.lifecycle[event]) return;
    await this.waitOn(
      'frame-lifecycle',
      x => {
        if (loaderId && x.loader.id !== loaderId) return false;
        return x.name === event;
      },
      timeoutMs,
    );
  }

  public async setFileInputFiles(objectId: string, files: string[]): Promise<void> {
    await this.devtoolsSession.send(
      'DOM.setFileInputFiles',
      {
        objectId,
        files,
      },
      this,
    );
  }

  public async evaluateOnNode<T>(nodeId: string, expression: string): Promise<T> {
    if (this.closedWithError) throw this.closedWithError;
    try {
      const result = await this.devtoolsSession.send(
        'Runtime.callFunctionOn',
        {
          functionDeclaration: `function executeRemoteFn() {
        return ${expression};
      }`,
          returnByValue: true,
          objectId: nodeId,
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
      if (err instanceof CanceledPromiseError) return;
      throw err;
    }
  }

  public async getFrameElementNodeId(): Promise<string> {
    try {
      if (!this.parentFrame || this.isolatedWorldElementObjectId)
        return this.isolatedWorldElementObjectId;
      const owner = await this.devtoolsSession.send(
        'DOM.getFrameOwner',
        { frameId: this.id },
        this,
      );
      this.isolatedWorldElementObjectId = await this.parentFrame.resolveNodeId(owner.backendNodeId);
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

  public async resolveNodeId(backendNodeId: number): Promise<string> {
    const result = await this.devtoolsSession.send(
      'DOM.resolveNode',
      {
        backendNodeId,
        executionContextId: this.getActiveContextId(true),
      },
      this,
    );
    return result.object.objectId;
  }

  /////// NAVIGATION ///////////////////////////////////////////////////////////////////////////////////////////////////

  public initiateNavigation(url: string, loaderId: string): void {
    // chain current listeners to new promise
    this.setLoader(loaderId, url);
  }

  public requestedNavigation(url: string, reason: NavigationReason, disposition: string): void {
    this.navigationReason = reason;
    this.disposition = disposition;

    this.emit('frame-requested-navigation', { frame: this, url, reason });
  }

  public onAttached(internalFrame: PageFrame): void {
    this.internalFrame = internalFrame;
    this.updateUrl();
    if (!internalFrame.loaderId) return;

    // if we this is the first loader and url is default, this is the first loader
    if (
      this.isDefaultUrl &&
      !this.defaultLoaderId &&
      Object.keys(this.navigationLoadersById).length === 0
    ) {
      this.defaultLoaderId = internalFrame.loaderId;
    }
    this.setLoader(internalFrame.loaderId);

    if (this.url || internalFrame.unreachableUrl) {
      // if this is a loaded frame, just count it as loaded. it shouldn't fail
      this.navigationLoadersById[internalFrame.loaderId].setNavigationResult(internalFrame.url);
    }
  }

  public onNavigated(frame: PageFrame): void {
    this.internalFrame = frame;
    this.updateUrl();

    const loader = this.navigationLoadersById[frame.loaderId] ?? this.activeLoader;

    if (frame.unreachableUrl) {
      loader.setNavigationResult(
        new Error(`Unreachable url for navigation "${frame.unreachableUrl}"`),
      );
    } else {
      loader.setNavigationResult(frame.url);
    }

    this.emit('frame-navigated', { frame: this, loaderId: frame.loaderId });
  }

  public onNavigatedWithinDocument(url: string): void {
    if (this.url === url) return;
    // we're using params on about:blank, so make sure to strip for url
    if (url.startsWith(DEFAULT_PAGE)) url = DEFAULT_PAGE;
    this.url = url;

    const isDomLoaded = this.activeLoader?.lifecycle?.DOMContentLoaded;

    const loaderId = `${InPageNavigationLoaderPrefix}${(this.inPageCounter += 1)}`;
    this.setLoader(loaderId, url);
    if (isDomLoaded) {
      this.activeLoader.markLoaded();
    }
    this.emit('frame-navigated', { frame: this, navigatedInDocument: true, loaderId });
  }

  /////// LIFECYCLE ////////////////////////////////////////////////////////////////////////////////////////////////////

  public onStoppedLoading(): void {
    if (!this.startedLoaderId) return;
    const loader = this.navigationLoadersById[this.startedLoaderId];
    loader?.onStoppedLoading();
  }

  public async waitForLoader(loaderId?: string, timeoutMs?: number): Promise<void> {
    if (!loaderId) {
      loaderId = this.activeLoaderId;
      if (loaderId === this.defaultLoaderId) {
        // wait for an actual frame to load
        const frameLoader = await this.waitOn('frame-loader-created', null, timeoutMs ?? 60e3);
        loaderId = frameLoader.loaderId;
      }
    }

    const hasLoaderError = await this.navigationLoadersById[loaderId]?.navigationResolver;
    if (hasLoaderError instanceof Error) throw hasLoaderError;

    if (!this.getActiveContextId(false)) {
      await this.waitForDefaultContext();
    }
  }

  public onLifecycleEvent(name: string, timestamp?: number, pageLoaderId?: string): void {
    const loaderId = pageLoaderId ?? this.activeLoaderId;
    if (name === 'init' && pageLoaderId) {
      // if the active loader never initiates before this new one, we should notify
      if (
        this.activeLoaderId &&
        this.activeLoaderId !== pageLoaderId &&
        !this.activeLoader.lifecycle.init &&
        !this.activeLoader.isNavigationComplete
      ) {
        // match chrome error if navigation is intercepted
        this.activeLoader.setNavigationResult(new CanceledPromiseError('net::ERR_ABORTED'));
      }
      this.startedLoaderId = pageLoaderId;
    }

    if (!this.navigationLoadersById[loaderId]) {
      this.setLoader(loaderId);
    }

    this.navigationLoadersById[loaderId].onLifecycleEvent(name);
    if (loaderId !== this.activeLoaderId) {
      let checkLoaderForInPage = false;
      for (const [historicalLoaderId, loader] of Object.entries(this.navigationLoadersById)) {
        if (loaderId === historicalLoaderId) {
          checkLoaderForInPage = true;
        }
        if (checkLoaderForInPage && historicalLoaderId.startsWith(InPageNavigationLoaderPrefix)) {
          loader.onLifecycleEvent(name);
          this.emit('frame-lifecycle', { frame: this, name, loader, timestamp });
        }
      }
    }

    if (loaderId !== this.defaultLoaderId) {
      this.emit('frame-lifecycle', {
        frame: this,
        name,
        loader: this.navigationLoadersById[loaderId],
        timestamp,
      });
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
    if (this.isolatedContextId === executionContextId) this.isolatedContextId = null;
  }

  public clearContextIds(): void {
    this.defaultContextId = null;
    this.isolatedContextId = null;
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
    if (!this.isAttached) throw new Error('Execution Context is not available in detached frame');

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

  public toJSON(): Pick<
    IPuppetFrame,
    'id' | 'parentId' | 'activeLoader' | 'name' | 'url' | 'navigationReason' | 'disposition'
  > {
    return {
      id: this.id,
      parentId: this.parentId,
      name: this.name,
      url: this.url,
      navigationReason: this.navigationReason,
      disposition: this.disposition,
      activeLoader: this.activeLoader,
    };
  }

  private setLoader(loaderId: string, url?: string): void {
    if (!loaderId) return;
    if (loaderId === this.activeLoaderId) return;
    if (this.navigationLoadersById[loaderId]) return;

    this.activeLoaderId = loaderId;
    this.logger.info('Queuing new navigation loader', {
      loaderId,
      frameId: this.id,
    });
    this.navigationLoadersById[loaderId] = new NavigationLoader(loaderId, this.logger);
    if (url) this.navigationLoadersById[loaderId].url = url;

    this.emit('frame-loader-created', {
      frame: this,
      loaderId,
    });
  }

  private async createIsolatedWorld(): Promise<number> {
    try {
      if (!this.isAttached) return;
      await new Promise(setImmediate);
      if (this.isolatedContextId) return this.isolatedContextId;

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
        this.getFrameElementNodeId().catch(() => null);
      }

      return executionContextId;
    } catch (error) {
      if (error instanceof CanceledPromiseError) {
        return;
      }
      if (error instanceof ProtocolError) {
        // 32000 code means frame doesn't exist, see if we just missed timing
        if (error.remoteError?.code === ContextNotFoundCode) {
          if (!this.isAttached) return;
        }
      }
      this.logger.warn('Failed to create isolated world.', {
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
    } else {
      this.url = undefined;
    }
  }
}
