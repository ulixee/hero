import Protocol from 'devtools-protocol';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import { IFrame, IFrameManagerEvents } from '@ulixee/unblocked-specification/agent/browser/IFrame';
import { bindFunctions } from '@ulixee/commons/lib/utils';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import { IWebsocketEvents } from '@ulixee/unblocked-specification/agent/browser/IWebsocketSession';
import IResourceMeta from '@ulixee/unblocked-specification/agent/net/IResourceMeta';
import {
  IPageEvents,
  TNewDocumentCallbackFn,
} from '@ulixee/unblocked-specification/agent/browser/IPage';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import DevtoolsSession from './DevtoolsSession';
import Frame from './Frame';
import NetworkManager from './NetworkManager';
import DomStorageTracker from './DomStorageTracker';
import InjectedScripts from './InjectedScripts';
import Page from './Page';
import Resources from './Resources';
import FrameNavigatedEvent = Protocol.Page.FrameNavigatedEvent;
import FrameTree = Protocol.Page.FrameTree;
import FrameDetachedEvent = Protocol.Page.FrameDetachedEvent;
import FrameAttachedEvent = Protocol.Page.FrameAttachedEvent;
import NavigatedWithinDocumentEvent = Protocol.Page.NavigatedWithinDocumentEvent;
import FrameStoppedLoadingEvent = Protocol.Page.FrameStoppedLoadingEvent;
import LifecycleEventEvent = Protocol.Page.LifecycleEventEvent;
import FrameRequestedNavigationEvent = Protocol.Page.FrameRequestedNavigationEvent;
import TargetInfo = Protocol.Target.TargetInfo;
import { Console } from './Console';
import { IBrowserNetworkEvents } from '@ulixee/unblocked-specification/agent/browser/IBrowserNetworkEvents';
import { IConsoleEvents } from '@ulixee/unblocked-specification/agent/browser/IConsole';

export const DEFAULT_PAGE = 'about:blank';
export const ISOLATED_WORLD = '__agent_world__';

export default class FramesManager extends TypedEventEmitter<IFrameManagerEvents> {
  public readonly framesById = new Map<string, Frame>();
  public readonly framesByFrameId = new Map<number, Frame>();
  public readonly page: Page;
  public readonly pendingNewDocumentScripts: { script: string; isolated: boolean }[] = [];

  public mainFrameId: string;

  public get main(): Frame {
    return this.framesById.get(this.mainFrameId);
  }

  public get activeFrames(): Frame[] {
    return Array.from(this.attachedFrameIds).map(x => this.framesById.get(x));
  }

  public devtoolsSession: DevtoolsSession;
  protected readonly logger: IBoundLog;

  private onFrameCreatedResourceEventsByFrameId: {
    [frameId: string]: {
      type: keyof IPageEvents;
      event: IPageEvents[keyof IPageEvents];
    }[];
  } = {};

  private get resources(): Resources {
    return this.page.browserContext.resources;
  }

  private attachedFrameIds = new Set<string>();
  private readonly events = new EventSubscriber();
  private readonly networkManager: NetworkManager;
  private readonly domStorageTracker: DomStorageTracker;
  private pageCallbacks = new Map<string, TNewDocumentCallbackFn>();

  private console: Console;

  private isReady: Promise<void>;

  constructor(page: Page, devtoolsSession: DevtoolsSession) {
    super();
    this.page = page;
    this.networkManager = page.networkManager;
    this.domStorageTracker = page.domStorageTracker;
    this.logger = page.logger.createChild(module);
    this.devtoolsSession = devtoolsSession;

    bindFunctions(this);

    this.console = new Console(devtoolsSession);

    this.events.on(page, 'resource-will-be-requested', this.onResourceWillBeRequested);
    this.events.on(page, 'resource-was-requested', this.onResourceWasRequested);
    this.events.on(page, 'resource-loaded', this.onResourceLoaded);
    this.events.on(page, 'resource-failed', this.onResourceFailed);
    this.events.on(page, 'navigation-response', this.onNavigationResourceResponse);
    this.events.on(this.console, 'callback-received', this.onCallbackReceived);

    this.events.on(this.networkManager, 'internal-request', (event: IBrowserNetworkEvents['internal-request']) => {
      const url = event.request.request.url;
      if (this.console.isConsoleRegisterUrl(url)) {
        this.console.registerFrameId(url, event.request.frameId);
      }
    });
  }

  public initialize(devtoolsSession: DevtoolsSession): Promise<void> {
    this.events.group(
      devtoolsSession.id,
      this.events.on(
        devtoolsSession,
        'Page.frameNavigated',
        this.onFrameNavigated.bind(this, devtoolsSession),
      ),
      this.events.on(
        devtoolsSession,
        'Page.navigatedWithinDocument',
        this.onFrameNavigatedWithinDocument,
      ),
      this.events.on(
        devtoolsSession,
        'Page.frameRequestedNavigation',
        this.onFrameRequestedNavigation,
      ),
      this.events.on(
        devtoolsSession,
        'Page.frameDetached',
        this.onFrameDetached.bind(this, devtoolsSession),
      ),
      this.events.on(
        devtoolsSession,
        'Page.frameAttached',
        this.onFrameAttached.bind(this, devtoolsSession),
      ),
      this.events.on(devtoolsSession, 'Page.frameStoppedLoading', this.onFrameStoppedLoading),
      this.events.on(
        devtoolsSession,
        'Page.lifecycleEvent',
        this.onLifecycleEvent.bind(this, devtoolsSession),
      ),
    );
    const id = devtoolsSession.id;
    this.events.once(devtoolsSession, 'disconnected', () => this.events.endGroup(id));

    this.isReady = new Promise<void>(async (resolve, reject) => {
      try {
        const [framesResponse, , readyStateResult] = await Promise.all([
          devtoolsSession.send('Page.getFrameTree'),
          devtoolsSession.send('Page.enable'),
          devtoolsSession
            .send('Runtime.evaluate', {
              expression: 'document.readyState',
            })
            .catch(() => {
              return {
                result: {
                  value: null,
                },
              };
            }),
          devtoolsSession.send('Page.setLifecycleEventsEnabled', { enabled: true }),
          InjectedScripts.install(this, devtoolsSession, this.onDomPaintEvent),
          this.console.initialize(),
        ]);
        this.recurseFrameTree(devtoolsSession, framesResponse.frameTree);
        resolve();

        if (this.main.securityOrigin && !this.main.activeLoader?.lifecycle?.load) {
          // sometimes we get a new anchor link that already has an initiated frame. If that's the case, newDocumentScripts won't trigger.
          // NOTE: we DON'T want this to trigger for internal pages (':', 'about:blank')
          await this.main.runPendingNewDocumentScripts();
          const readyState = readyStateResult.result?.value;
          const loaderId = this.main.activeLoaderId;
          let loadName: string;
          if (readyState === 'interactive') loadName = 'DOMContentLoaded';
          else if (readyState === 'complete') loadName = 'load';
          if (loadName) setImmediate(() => this.main.onLifecycleEvent(loadName, null, loaderId));
        }
      } catch (error) {
        if (error instanceof CanceledPromiseError) {
          resolve();
          return;
        }
        reject(error);
      }
    });
    return this.isReady;
  }

  public reset(): void {
    for (const frame of this.framesById.values()) {
      if (frame.parentId) {
        this.framesByFrameId.delete(frame.frameId);
        this.framesById.delete(frame.id);
        frame.close();
      }
    }
    this.pendingNewDocumentScripts.length = 0;
    this.onFrameCreatedResourceEventsByFrameId = {};
  }

  public close(error?: Error): void {
    this.events.close();
    this.cancelPendingEvents('FramesManager closed');
    for (const frame of this.framesById.values()) {
      frame.close(error);
    }
    this.framesById.clear();
    this.framesByFrameId.clear();
  }

  public async addNewDocumentScript(
    script: string,
    installInIsolatedScope = true,
    callbacks?: { [name: string]: TNewDocumentCallbackFn | null },
    devtoolsSession?: DevtoolsSession,
  ): Promise<{ identifier: string }> {
    devtoolsSession ??= this.devtoolsSession;
    if (callbacks) {
      script = this.console.injectCallbackIntoScript(script);
      for (const [name, onCallbackFn] of Object.entries(callbacks)) {
        if (onCallbackFn) {
          if (this.pageCallbacks.has(name) && this.pageCallbacks.get(name) !== onCallbackFn)
            throw new Error(`Duplicate page callback registered ${name}`);
          this.pageCallbacks.set(name, onCallbackFn);
        }
      }
    }
    const installedScript = await devtoolsSession.send('Page.addScriptToEvaluateOnNewDocument', {
      source: script,
      worldName: installInIsolatedScope ? ISOLATED_WORLD : undefined,
    });
    this.pendingNewDocumentScripts.push({ script, isolated: installInIsolatedScope });
    // sometimes we get a new anchor link that already has an initiated frame. If that's the case, newDocumentScripts won't trigger.
    // NOTE: we DON'T want this to trigger for internal pages (':', 'about:blank')
    if (this.main?.url?.startsWith('http')) {
      await this.main.runPendingNewDocumentScripts();
    }
    return installedScript;
  }

  public checkForResolvedNavigation(
    browserRequestId: string,
    resource: IResourceMeta,
    error?: Error,
  ): boolean {
    if (resource.type !== 'Document' || resource.isRedirect) return;

    for (const frame of this.framesById.values()) {
      const matchingResource = frame.navigations.pendingResourceId(
        browserRequestId,
        resource.request?.url,
        resource.response?.url,
      );
      if (matchingResource) {
        frame.navigations.onResourceLoaded(
          matchingResource,
          resource.id,
          resource.response?.statusCode,
          error,
        );
        return true;
      }
    }
    return false;
  }

  public frameWithPendingNavigation(
    browserRequestId: string,
    requestedUrl: string,
    finalUrl: string,
  ): Frame | null {
    for (const frame of this.framesById.values()) {
      const isMatch = frame.navigations.pendingResourceId(browserRequestId, requestedUrl, finalUrl);
      if (isMatch) return frame;
    }
  }

  public clearChildFrames(): void {
    for (const [id, childFrame] of this.framesById) {
      if (id !== this.mainFrameId && !this.attachedFrameIds.has(id)) {
        this.framesById.delete(id);
        this.framesByFrameId.delete(childFrame.frameId);
        try {
          childFrame.close();
        } catch (error) {
          if (!(error instanceof CanceledPromiseError)) {
            this.logger.warn('Error closing frame after navigation', {
              error,
              id,
              url: childFrame.url,
            });
          }
        }
      }
    }
  }

  public async onFrameTargetAttached(
    devtoolsSession: DevtoolsSession,
    target: TargetInfo,
  ): Promise<void> {
    await this.isReady;

    const frame = this.framesById.get(target.targetId);
    if (frame) {
      await frame.updateDevtoolsSession(devtoolsSession);
    }
  }

  /////// EXECUTION CONTEXT ////////////////////////////////////////////////////

  public getSecurityOrigins(): { origin: string; frameId: string }[] {
    const origins: { origin: string; frameId: string }[] = [];
    for (const frame of this.framesById.values()) {
      if (this.attachedFrameIds.has(frame.id)) {
        const origin = frame.securityOrigin;
        if (origin && !origins.some(x => x.origin === origin)) {
          origins.push({ origin, frameId: frame.id });
        }
      }
    }
    return origins;
  }

  public async waitForFrame(
    frameDetails: { frameId: string; loaderId?: string },
    url: string,
    isInitiatingNavigation = false,
  ): Promise<void> {
    await this.isReady;
    const { frameId, loaderId } = frameDetails;
    const frame = this.framesById.get(frameId);
    if (isInitiatingNavigation) {
      frame.initiateNavigation(url, loaderId);
    }
    await frame.waitForNavigationLoader(loaderId);
  }

  public async getDefaultContextIdForFrameId(opts: {
    frameId: string;
    devtoolsSession?: DevtoolsSession;
    refresh?: boolean;
  }): Promise<number | undefined> {
    const devtoolsSession = opts.devtoolsSession ?? this.devtoolsSession;
    const contextId = new Resolvable<number>(10e3);

    const subcriber = this.events.on(devtoolsSession, 'Runtime.executionContextCreated', event => {
      const { context } = event;
      const frameId = context.auxData.frameId as string;
      const type = context.auxData.type as string;

      if (
        opts.frameId === frameId &&
        context.name === '' &&
        context.auxData.isDefault === true &&
        type === 'default'
      ) {
        contextId.resolve(context.id);
      }
    });

    // Enabling and disabling will trigger ExecutionContextCreatedEvent for all contexts
    await Promise.all([
      devtoolsSession.send('Runtime.enable'),
      devtoolsSession.send('Runtime.disable'),
    ]);

    try {
      return await contextId.promise;
    } finally {
      this.events.off(subcriber);
    }
  }

  /////// FRAMES ///////////////////////////////////////////////////////////////

  private async onFrameNavigated(
    devtoolsSession: DevtoolsSession,
    navigatedEvent: FrameNavigatedEvent,
  ): Promise<void> {
    await this.isReady;
    const startUrl = this.main?.url;
    const frame = this.recordFrame(devtoolsSession, navigatedEvent.frame);
    // if main frame, clear out other frames
    if (!frame.parentId) {
      if (startUrl !== navigatedEvent.frame.url) {
        this.attachedFrameIds.clear();
        this.attachedFrameIds.add(frame.id);
      }
      this.clearChildFrames();
    }
    frame.onNavigated(navigatedEvent.frame, navigatedEvent);
    this.emit('frame-navigated', { frame, loaderId: navigatedEvent.frame.loaderId });
    if (!frame.isDefaultUrl && !frame.parentId && devtoolsSession === this.devtoolsSession) {
      this.pendingNewDocumentScripts.length = 0;
    }
    this.domStorageTracker.track(frame.securityOrigin);
  }

  private async onFrameStoppedLoading(event: FrameStoppedLoadingEvent): Promise<void> {
    await this.isReady;
    const { frameId } = event;

    this.framesById.get(frameId)?.onStoppedLoading();
  }

  private async onFrameRequestedNavigation(
    navigatedEvent: FrameRequestedNavigationEvent,
  ): Promise<void> {
    await this.isReady;
    const { frameId, url, reason, disposition } = navigatedEvent;
    this.framesById.get(frameId).requestedNavigation(url, reason, disposition);
  }

  private async onFrameNavigatedWithinDocument(
    navigatedEvent: NavigatedWithinDocumentEvent,
  ): Promise<void> {
    await this.isReady;
    const { frameId, url } = navigatedEvent;
    this.framesById.get(frameId).onNavigatedWithinDocument(url);
  }

  private async onFrameDetached(
    devtoolsSession: DevtoolsSession,
    frameDetachedEvent: FrameDetachedEvent,
  ): Promise<void> {
    await this.isReady;
    const { frameId, reason } = frameDetachedEvent;
    const parentId = this.framesById.get(frameId)?.parentId;
    if (
      reason === 'remove' &&
      // This is a local -> remote frame transtion, where
      // Page.frameDetached arrives after Target.attachedToTarget.
      // We've already handled the new target and frame reattach - nothing to do here.
      (devtoolsSession === this.devtoolsSession ||
        devtoolsSession === this.framesById.get(parentId)?.devtoolsSession)
    ) {
      this.attachedFrameIds.delete(frameId);
    } else if (reason === 'swap') {
      this.framesById.get(frameId).didSwapOutOfProcess = true;
      this.framesById.get(frameId).activeLoader.setNavigationResult();
    }
  }

  private async onFrameAttached(
    devtoolsSession: DevtoolsSession,
    frameAttachedEvent: FrameAttachedEvent,
  ): Promise<void> {
    await this.isReady;
    const { frameId, parentFrameId } = frameAttachedEvent;
    const frame = this.framesById.get(frameId);
    if (frame) {
      if (devtoolsSession && frame.isOopif()) {
        // If an OOP iframes becomes a normal iframe again
        // it is first attached to the parent page before
        // the target is removed.
        await frame.updateDevtoolsSession(devtoolsSession);
      }
      return;
    }
    this.recordFrame(devtoolsSession, { id: frameId, parentId: parentFrameId } as any);
    this.attachedFrameIds.add(frameId);
  }

  private async onLifecycleEvent(
    devtoolsSession: DevtoolsSession,
    event: LifecycleEventEvent,
  ): Promise<void> {
    await this.isReady;
    const { frameId, name, loaderId, timestamp } = event;
    const eventTime = this.networkManager.monotonicTimeToUnix(timestamp);
    const frame = this.recordFrame(devtoolsSession, { id: frameId, loaderId } as any);
    frame.onLifecycleEvent(name, eventTime, loaderId);
    this.domStorageTracker.track(frame.securityOrigin);
  }

  private onDomPaintEvent(payload: string, frame: IFrame): void {
    const { event, timestamp, url } = JSON.parse(payload);
    const frameId = frame.frameId;
    void this.isReady.then(() => {
      const coreFrame = this.framesByFrameId.get(frameId);
      coreFrame.navigations.onDomPaintEvent(event, url, timestamp);
      return null;
    });
  }

  private recurseFrameTree(devtoolsSession: DevtoolsSession, frameTree: FrameTree): void {
    const { frame, childFrames } = frameTree;
    if (devtoolsSession === this.devtoolsSession) {
      this.mainFrameId = frame.id;
      this.recordFrame(devtoolsSession, frame, true);
    } else if (!this.framesById.has(frame.id)) {
      this.recordFrame(devtoolsSession, frame, true);
    }

    this.attachedFrameIds.add(frame.id);

    if (!childFrames) return;
    for (const childFrame of childFrames) {
      this.recurseFrameTree(devtoolsSession, childFrame);
    }
  }

  private recordFrame(
    devtoolsSession: DevtoolsSession,
    newFrame: Protocol.Page.Frame,
    isFrameTreeRecurse = false,
  ): Frame {
    const { id, parentId } = newFrame;
    if (this.framesById.has(id)) {
      const frame = this.framesById.get(id);
      if (isFrameTreeRecurse || (frame.isOopif() && newFrame.url)) frame.onAttached(newFrame);
      this.domStorageTracker.track(frame.securityOrigin);
      return frame;
    }

    const parentFrame = parentId ? this.framesById.get(parentId) : null;
    const frame = new Frame(
      this,
      newFrame,
      devtoolsSession,
      this.logger,
      () => this.attachedFrameIds.has(id),
      parentFrame,
    );
    this.framesById.set(id, frame);
    this.framesByFrameId.set(frame.frameId, frame);

    this.emit('frame-created', { frame, loaderId: newFrame.loaderId });

    this.replayMissedResourceEventsAfterFrameAttached(frame);

    this.domStorageTracker.track(frame.securityOrigin);

    return frame;
  }

  // MERGE FROM Tab.ts. Needs to be sorted out

  private replayMissedResourceEventsAfterFrameAttached(frame: Frame): void {
    const resourceEvents = this.onFrameCreatedResourceEventsByFrameId[frame.id];
    if (resourceEvents) {
      for (const { event: resourceEvent, type } of resourceEvents) {
        if (type === 'resource-will-be-requested')
          this.onResourceWillBeRequested(resourceEvent as any);
        if (type === 'resource-was-requested') this.onResourceWasRequested(resourceEvent as any);
        else if (type === 'navigation-response')
          this.onNavigationResourceResponse(resourceEvent as any);
        else if (type === 'resource-loaded') this.onResourceLoaded(resourceEvent as any);
      }
    }
    delete this.onFrameCreatedResourceEventsByFrameId[frame.id];
  }

  private getFrameForEventOrQueueForReady(
    type: keyof IPageEvents,
    event: IPageEvents[keyof IPageEvents] & { frameId: string },
  ): Frame {
    const frame = this.framesById.get(event.frameId);
    if (event.frameId && !frame) {
      this.onFrameCreatedResourceEventsByFrameId[event.frameId] ??= [];
      const events = this.onFrameCreatedResourceEventsByFrameId[event.frameId];
      if (!events.some(x => x.event === event)) {
        events.push({ event, type });
      }
    }
    return frame;
  }

  private onResourceWillBeRequested(event: IPageEvents['resource-will-be-requested']): void {
    const lastCommandId = this.page.browserContext.commandMarker.lastId;
    const { resource, isDocumentNavigation, frameId, redirectedFromUrl } = event;
    const url = resource.url.href;

    const frame = frameId
      ? this.getFrameForEventOrQueueForReady('resource-will-be-requested', event)
      : this.main;

    if (!frame) return;
    const navigations = frame.navigations;

    if (isDocumentNavigation && !navigations.top) {
      navigations.onNavigationRequested(
        'newFrame',
        url,
        lastCommandId,
        resource.browserRequestId,
        event.loaderId,
      );
    }
    resource.hasUserGesture ||= navigations.didGotoUrl(url);

    this.resources.onBrowserWillRequest(this.page.tabId, frame.frameId, resource);

    if (isDocumentNavigation && !event.resource.browserCanceled) {
      navigations.onHttpRequested(
        url,
        lastCommandId,
        redirectedFromUrl,
        resource.browserRequestId,
        event.loaderId,
      );
    }
  }

  private onResourceWasRequested(event: IPageEvents['resource-was-requested']): void {
    const frame = event.frameId
      ? this.getFrameForEventOrQueueForReady('resource-was-requested', event as any)
      : this.main;

    // if we didn't get a frame, don't keep going
    if (!frame) return;

    this.resources.onBrowserDidRequest(this.page.tabId, frame.frameId, event.resource);
  }

  private onResourceLoaded(event: IPageEvents['resource-loaded']): void {
    const { resource, frameId, loaderId } = event;

    const frame = frameId
      ? this.getFrameForEventOrQueueForReady('resource-loaded', event as any)
      : this.main;
    this.resources.onBrowserDidRequest(this.page.tabId, frame?.frameId, resource);

    // if we didn't get a frame, don't keep going
    if (!frame) return;

    const pendingResourceId = frame.navigations.pendingResourceId(
      resource.browserRequestId,
      resource.url?.href,
      resource.responseUrl,
      event.loaderId,
    );
    if (pendingResourceId) {
      if (resource.browserServedFromCache) {
        frame.navigations.onHttpResponded(
          resource.browserRequestId,
          resource.responseUrl ?? resource.url?.href,
          loaderId,
          resource.browserLoadedTime,
        );
      }
      const existingResource = this.resources.getBrowserRequestLatestResource(
        resource.browserRequestId,
      );
      if (existingResource) {
        frame.navigations.onResourceLoaded(pendingResourceId, existingResource.id, resource.status);
      }
    }

    const isKnownResource = this.resources.onBrowserResourceLoaded(this.page.tabId, resource);

    if (
      !isKnownResource &&
      (resource.browserServedFromCache ||
        resource.url?.protocol === 'blob:' ||
        !this.resources.hasRegisteredMitm)
    ) {
      this.resources
        .createNewResourceIfUnseen(this.page.tabId, frame.frameId, resource, event.body)
        .then(meta => meta && this.checkForResolvedNavigation(resource.browserRequestId, meta))
        .catch(() => null);
    }
  }

  private onResourceFailed(event: IPageEvents['resource-failed']): void {
    const { resource } = event;
    const loadError = Resources.translateResourceError(resource);
    const frame = this.framesById.get(resource.frameId);

    const resourceMeta = this.resources.onBrowserRequestFailed(
      this.page.tabId,
      frame?.frameId,
      resource,
      loadError,
    );

    if (resourceMeta) {
      const browserRequestId = resource.browserRequestId;
      this.checkForResolvedNavigation(browserRequestId, resourceMeta, loadError);
    }
  }

  private onNavigationResourceResponse(event: IPageEvents['navigation-response']): void {
    const frame = event.frameId
      ? this.getFrameForEventOrQueueForReady('navigation-response', event)
      : this.main;

    if (!frame) {
      return;
    }

    frame.navigations.onHttpResponded(
      event.browserRequestId,
      event.url,
      event.loaderId,
      event.timestamp,
    );
  }

  private async onCallbackReceived(
    event: IConsoleEvents['callback-received'],
  ): Promise<void> {
    const callback = this.pageCallbacks.get(event.name);
    let frame = this.framesById.get(event.id);
    if (!frame) {
      // try again after ready
      await this.isReady;
      frame = this.framesById.get(event.id);
      if (!frame) return;
    }

    if (callback) await callback(event.payload, frame);
    this.page.emit('page-callback-triggered', {
      name: event.name,
      frameId: frame.frameId,
      payload: event.payload,
    });
  }
}
