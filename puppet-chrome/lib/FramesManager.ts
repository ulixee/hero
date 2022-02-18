import Protocol from 'devtools-protocol';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import IRegisteredEventListener from '@ulixee/commons/interfaces/IRegisteredEventListener';
import { IPuppetFrameManagerEvents } from '@ulixee/hero-interfaces/IPuppetFrame';
import { bindFunctions } from '@ulixee/commons/lib/utils';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import injectedSourceUrl from '@ulixee/hero-interfaces/injectedSourceUrl';
import { DevtoolsSession } from './DevtoolsSession';
import Frame from './Frame';
import { NetworkManager } from './NetworkManager';
import { DomStorageTracker } from './DomStorageTracker';
import FrameNavigatedEvent = Protocol.Page.FrameNavigatedEvent;
import FrameTree = Protocol.Page.FrameTree;
import FrameDetachedEvent = Protocol.Page.FrameDetachedEvent;
import FrameAttachedEvent = Protocol.Page.FrameAttachedEvent;
import ExecutionContextDestroyedEvent = Protocol.Runtime.ExecutionContextDestroyedEvent;
import ExecutionContextCreatedEvent = Protocol.Runtime.ExecutionContextCreatedEvent;
import NavigatedWithinDocumentEvent = Protocol.Page.NavigatedWithinDocumentEvent;
import FrameStoppedLoadingEvent = Protocol.Page.FrameStoppedLoadingEvent;
import LifecycleEventEvent = Protocol.Page.LifecycleEventEvent;
import FrameRequestedNavigationEvent = Protocol.Page.FrameRequestedNavigationEvent;
import Page = Protocol.Page;

export const DEFAULT_PAGE = 'about:blank';
export const ISOLATED_WORLD = '__hero_world__';

export default class FramesManager extends TypedEventEmitter<IPuppetFrameManagerEvents> {
  public framesById = new Map<string, Frame>();

  public get mainFrameId(): string {
    return Array.from(this.attachedFrameIds).find(id => !this.framesById.get(id).parentId);
  }

  public get main(): Frame {
    return this.framesById.get(this.mainFrameId);
  }

  public get activeFrames(): Frame[] {
    return Array.from(this.attachedFrameIds).map(x => this.framesById.get(x));
  }

  protected readonly logger: IBoundLog;

  private attachedFrameIds = new Set<string>();
  private activeContextIds = new Set<number>();
  private readonly events = new EventSubscriber();
  private readonly devtoolsSession: DevtoolsSession;
  private readonly networkManager: NetworkManager;
  private readonly domStorageTracker: DomStorageTracker;

  private isReady: Promise<void>;

  constructor(
    devtoolsSession: DevtoolsSession,
    networkManager: NetworkManager,
    domStorageTracker: DomStorageTracker,
    logger: IBoundLog,
  ) {
    super();
    this.devtoolsSession = devtoolsSession;
    this.networkManager = networkManager;
    this.domStorageTracker = domStorageTracker;
    this.logger = logger.createChild(module);

    bindFunctions(this);

    const session = this.devtoolsSession;
    this.events.on(session, 'Page.frameNavigated', this.onFrameNavigated);
    this.events.on(session, 'Page.navigatedWithinDocument', this.onFrameNavigatedWithinDocument);
    this.events.on(session, 'Page.frameRequestedNavigation', this.onFrameRequestedNavigation);
    this.events.on(session, 'Page.frameDetached', this.onFrameDetached);
    this.events.on(session, 'Page.frameAttached', this.onFrameAttached);
    this.events.on(session, 'Page.frameStoppedLoading', this.onFrameStoppedLoading);
    this.events.on(session, 'Page.lifecycleEvent', this.onLifecycleEvent);
    this.events.on(session, 'Runtime.executionContextsCleared', this.onExecutionContextsCleared);
    this.events.on(session, 'Runtime.executionContextDestroyed', this.onExecutionContextDestroyed);
    this.events.on(session, 'Runtime.executionContextCreated', this.onExecutionContextCreated);
  }

  public initialize(): Promise<void> {
    this.isReady = new Promise<void>(async (resolve, reject) => {
      try {
        const [framesResponse, , readyStateResult] = await Promise.all([
          this.devtoolsSession.send('Page.getFrameTree'),
          this.devtoolsSession.send('Page.enable'),
          this.devtoolsSession.send('Runtime.evaluate', {
            expression: 'document.readyState',
          }),
          this.devtoolsSession.send('Page.setLifecycleEventsEnabled', { enabled: true }),
          this.devtoolsSession.send('Runtime.enable'),
          this.devtoolsSession.send('Page.addScriptToEvaluateOnNewDocument', {
            source: `//# sourceURL=${injectedSourceUrl}`,
            worldName: ISOLATED_WORLD,
          }),
        ]);
        this.recurseFrameTree(framesResponse.frameTree);
        resolve();
        if (this.main.securityOrigin && !this.main.activeLoader?.lifecycle?.load) {
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

  public close(error?: Error): void {
    this.events.close();
    this.cancelPendingEvents('FramesManager closed');
    for (const frame of this.framesById.values()) {
      frame.close(error);
    }
  }

  public async addPageCallback(
    name: string,
    onCallback: (payload: any, frameId: string) => any,
    isolateFromWebPageEnvironment?: boolean,
  ): Promise<IRegisteredEventListener> {
    const params: Protocol.Runtime.AddBindingRequest = {
      name,
    };
    if (isolateFromWebPageEnvironment) {
      (params as any).executionContextName = ISOLATED_WORLD;
    }
    // add binding to every new context automatically
    await this.devtoolsSession.send('Runtime.addBinding', params);
    return this.events.on(this.devtoolsSession, 'Runtime.bindingCalled', async event => {
      if (event.name === name) {
        await this.isReady;
        const frameId = this.getFrameIdForExecutionContext(event.executionContextId);
        onCallback(event.payload, frameId);
      }
    });
  }

  public async addNewDocumentScript(
    script: string,
    installInIsolatedScope = true,
  ): Promise<{ identifier: string }> {
    const installedScript = await this.devtoolsSession.send(
      'Page.addScriptToEvaluateOnNewDocument',
      {
        source: script,
        worldName: installInIsolatedScope ? ISOLATED_WORLD : undefined,
      },
    );

    // sometimes we get a new anchor link that already has an initiated frame. If that's the case, newDocumentScripts won't trigger.
    // NOTE: we DON'T want this to trigger for internal pages (':', 'about:blank')
    if (this.main.url?.startsWith('http')) {
      await this.main.evaluate(script, installInIsolatedScope, { retriesWaitingForLoad: 1 });
    }
    return installedScript;
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
    await frame.waitForLoader(loaderId);
  }

  public getFrameIdForExecutionContext(executionContextId: number): string | undefined {
    for (const frame of this.framesById.values()) {
      if (frame.hasContextId(executionContextId)) return frame.id;
    }
  }

  private async onExecutionContextDestroyed(event: ExecutionContextDestroyedEvent): Promise<void> {
    await this.isReady;
    this.activeContextIds.delete(event.executionContextId);
    for (const frame of this.framesById.values()) {
      frame.removeContextId(event.executionContextId);
    }
  }

  private async onExecutionContextsCleared(): Promise<void> {
    await this.isReady;
    this.activeContextIds.clear();
    for (const frame of this.framesById.values()) {
      frame.clearContextIds();
    }
  }

  private async onExecutionContextCreated(event: ExecutionContextCreatedEvent): Promise<void> {
    await this.isReady;
    const { context } = event;
    const frameId = context.auxData.frameId as string;
    const type = context.auxData.type as string;

    this.activeContextIds.add(context.id);
    const frame = this.framesById.get(frameId);
    if (!frame) {
      this.logger.warn('No frame for active context!', {
        frameId,
        executionContextId: context.id,
      });
    }

    const isDefault =
      context.name === '' && context.auxData.isDefault === true && type === 'default';
    const isHeroWorld = context.name === ISOLATED_WORLD && type === 'isolated';
    if (isDefault || isHeroWorld) {
      frame?.addContextId(context.id, isDefault);
    }
  }

  /////// FRAMES ///////////////////////////////////////////////////////////////

  private async onFrameNavigated(navigatedEvent: FrameNavigatedEvent): Promise<void> {
    await this.isReady;
    const frame = this.recordFrame(navigatedEvent.frame);
    frame.onNavigated(navigatedEvent.frame);
    this.domStorageTracker.track(frame.securityOrigin);
  }

  private async onFrameStoppedLoading(event: FrameStoppedLoadingEvent): Promise<void> {
    await this.isReady;
    const { frameId } = event;

    this.framesById.get(frameId).onStoppedLoading();
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

  private async onFrameDetached(frameDetachedEvent: FrameDetachedEvent): Promise<void> {
    await this.isReady;
    const { frameId } = frameDetachedEvent;
    this.attachedFrameIds.delete(frameId);
  }

  private async onFrameAttached(frameAttachedEvent: FrameAttachedEvent): Promise<void> {
    await this.isReady;
    const { frameId, parentFrameId } = frameAttachedEvent;

    this.recordFrame({ id: frameId, parentId: parentFrameId } as any);
    this.attachedFrameIds.add(frameId);
  }

  private async onLifecycleEvent(event: LifecycleEventEvent): Promise<void> {
    await this.isReady;
    const { frameId, name, loaderId, timestamp } = event;
    const eventTime = this.networkManager.monotonicTimeToUnix(timestamp);
    const frame = this.recordFrame({ id: frameId, loaderId } as any);
    frame.onLifecycleEvent(name, eventTime, loaderId);
    this.domStorageTracker.track(frame.securityOrigin);
  }

  private recurseFrameTree(frameTree: FrameTree): void {
    const { frame, childFrames } = frameTree;
    this.recordFrame(frame, true);

    this.attachedFrameIds.add(frame.id);

    if (!childFrames) return;
    for (const childFrame of childFrames) {
      this.recurseFrameTree(childFrame);
    }
  }

  private recordFrame(newFrame: Page.Frame, isFrameTreeRecurse = false): Frame {
    const { id, parentId } = newFrame;
    if (this.framesById.has(id)) {
      const frame = this.framesById.get(id);
      if (isFrameTreeRecurse) frame.onAttached(newFrame);
      this.domStorageTracker.track(frame.securityOrigin);
      return frame;
    }

    const parentFrame = parentId ? this.framesById.get(parentId) : null;
    const frame = new Frame(
      newFrame,
      this.activeContextIds,
      this.devtoolsSession,
      this.logger,
      () => this.attachedFrameIds.has(id),
      parentFrame,
    );
    this.framesById.set(id, frame);

    this.emit('frame-created', { frame, loaderId: newFrame.loaderId });

    this.domStorageTracker.track(frame.securityOrigin);

    return frame;
  }
}
