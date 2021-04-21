import Protocol from 'devtools-protocol';
import * as eventUtils from '@secret-agent/commons/eventUtils';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import IRegisteredEventListener from '@secret-agent/core-interfaces/IRegisteredEventListener';
import { IPuppetFrameManagerEvents } from '@secret-agent/core-interfaces/IPuppetFrame';
import { IBoundLog } from '@secret-agent/core-interfaces/ILog';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import injectedSourceUrl from '@secret-agent/core-interfaces/injectedSourceUrl';
import { DevtoolsSession } from './DevtoolsSession';
import Frame from './Frame';
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
export const ISOLATED_WORLD = '__sa_world__';

export default class FramesManager extends TypedEventEmitter<IPuppetFrameManagerEvents> {
  public framesById = new Map<string, Frame>();

  public get mainFrameId() {
    return Array.from(this.attachedFrameIds).find(id => !this.framesById.get(id).parentId);
  }

  public get main() {
    return this.framesById.get(this.mainFrameId);
  }

  public get activeFrames() {
    return Array.from(this.attachedFrameIds).map(x => this.framesById.get(x));
  }

  protected readonly logger: IBoundLog;

  private attachedFrameIds = new Set<string>();
  private activeContextIds = new Set<number>();
  private readonly registeredEvents: IRegisteredEventListener[] = [];
  private readonly devtoolsSession: DevtoolsSession;

  private isReady: Promise<void>;

  constructor(devtoolsSession: DevtoolsSession, logger: IBoundLog) {
    super();
    this.devtoolsSession = devtoolsSession;
    this.logger = logger.createChild(module);
    this.registeredEvents = eventUtils.addEventListeners(this.devtoolsSession, [
      ['Page.frameNavigated', this.onFrameNavigated.bind(this)],
      ['Page.navigatedWithinDocument', this.onFrameNavigatedWithinDocument.bind(this)],
      ['Page.frameRequestedNavigation', this.onFrameRequestedNavigation.bind(this)],
      ['Page.frameDetached', this.onFrameDetached.bind(this)],
      ['Page.frameAttached', this.onFrameAttached.bind(this)],
      ['Page.frameStoppedLoading', this.onFrameStoppedLoading.bind(this)],
      ['Page.lifecycleEvent', this.onLifecycleEvent.bind(this)],
      ['Runtime.executionContextsCleared', this.onExecutionContextsCleared.bind(this)],
      ['Runtime.executionContextDestroyed', this.onExecutionContextDestroyed.bind(this)],
      ['Runtime.executionContextCreated', this.onExecutionContextCreated.bind(this)],
    ]);
  }

  public initialize() {
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
        if (this.main.securityOrigin && !this.main.lifecycleEvents?.load) {
          const readyState = readyStateResult.result?.value;
          let loadName: string;
          if (readyState === 'interactive') loadName = 'DOMContentLoaded';
          else if (readyState === 'complete') loadName = 'load';
          if (loadName) setImmediate(() => this.main.onLifecycleEvent(loadName));
        }
      } catch (error) {
        if (error instanceof CanceledPromiseError) {
          return;
        }
        reject(error);
      }
    });
    return this.isReady;
  }

  public close(error?: Error) {
    eventUtils.removeEventListeners(this.registeredEvents);
    this.cancelPendingEvents('FramesManager closed');
    for (const frame of this.framesById.values()) {
      frame.close(error);
    }
  }

  public async addPageCallback(
    name: string,
    onCallback: (payload: any, frameId: string) => any,
  ): Promise<IRegisteredEventListener> {
    // add binding to every new context automatically
    await this.devtoolsSession.send('Runtime.addBinding', {
      name,
    });
    return eventUtils.addEventListener(
      this.devtoolsSession,
      'Runtime.bindingCalled',
      async event => {
        if (event.name === name) {
          await this.isReady;
          const frameId = this.getFrameIdForExecutionContext(event.executionContextId);
          onCallback(event.payload, frameId);
        }
      },
    );
  }

  public async addNewDocumentScript(script: string, installInIsolatedScope = true) {
    await this.devtoolsSession.send('Page.addScriptToEvaluateOnNewDocument', {
      source: script,
      worldName: installInIsolatedScope ? ISOLATED_WORLD : undefined,
    });

    // sometimes we get a new anchor link that already has an initiated frame. If that's the case, newDocumentScripts won't trigger.
    // NOTE: we DON'T want this to trigger for internal pages (':', 'about:blank')
    if (this.main.url?.startsWith('http')) {
      await this.main.evaluate(script, installInIsolatedScope, { retriesWaitingForLoad: 1 });
    }
  }

  /////// EXECUTION CONTEXT ////////////////////////////////////////////////////

  public getSecurityOrigins() {
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
  ) {
    await this.isReady;
    const { frameId, loaderId } = frameDetails;
    const frame = this.framesById.get(frameId);
    if (isInitiatingNavigation) {
      frame.initiateNavigation(url, loaderId);
    }
    const loaderError = await frame.waitForLoader(loaderId);
    if (loaderError) throw loaderError;
  }

  public getFrameIdForExecutionContext(executionContextId: number) {
    for (const frame of this.framesById.values()) {
      if (frame.hasContextId(executionContextId)) return frame.id;
    }
  }

  private async onExecutionContextDestroyed(event: ExecutionContextDestroyedEvent) {
    await this.isReady;
    this.activeContextIds.delete(event.executionContextId);
    for (const frame of this.framesById.values()) {
      frame.removeContextId(event.executionContextId);
    }
  }

  private async onExecutionContextsCleared() {
    await this.isReady;
    this.activeContextIds.clear();
    for (const frame of this.framesById.values()) {
      frame.clearContextIds();
    }
  }

  private async onExecutionContextCreated(event: ExecutionContextCreatedEvent) {
    await this.isReady;
    const { context } = event;
    const frameId = context.auxData.frameId as string;

    this.activeContextIds.add(context.id);
    const frame = this.framesById.get(frameId);
    if (!frame) {
      this.logger.warn('No frame for active context!', {
        frameId,
        executionContextId: context.id,
      });
    }
    frame?.addContextId(context.id, context.name === '' || context.auxData?.isDefault === true);
  }

  /////// FRAMES ///////////////////////////////////////////////////////////////

  private async onFrameNavigated(navigatedEvent: FrameNavigatedEvent) {
    await this.isReady;
    const frame = this.recordFrame(navigatedEvent.frame);
    frame.onNavigated(navigatedEvent.frame);
  }

  private async onFrameStoppedLoading(event: FrameStoppedLoadingEvent) {
    await this.isReady;
    const { frameId } = event;

    this.framesById.get(frameId).onStoppedLoading();
  }

  private async onFrameRequestedNavigation(navigatedEvent: FrameRequestedNavigationEvent) {
    await this.isReady;
    const { frameId, url, reason, disposition } = navigatedEvent;
    this.framesById.get(frameId).requestedNavigation(url, reason, disposition);
  }

  private async onFrameNavigatedWithinDocument(navigatedEvent: NavigatedWithinDocumentEvent) {
    await this.isReady;
    const { frameId, url } = navigatedEvent;
    this.framesById.get(frameId).onNavigatedWithinDocument(url);
  }

  private async onFrameDetached(frameDetachedEvent: FrameDetachedEvent) {
    await this.isReady;
    const { frameId } = frameDetachedEvent;
    this.attachedFrameIds.delete(frameId);
  }

  private async onFrameAttached(frameAttachedEvent: FrameAttachedEvent) {
    await this.isReady;
    const { frameId, parentFrameId } = frameAttachedEvent;

    this.recordFrame({ id: frameId, parentId: parentFrameId } as any);
    this.attachedFrameIds.add(frameId);
  }

  private async onLifecycleEvent(event: LifecycleEventEvent) {
    await this.isReady;
    const { frameId, name, loaderId } = event;
    const frame = this.recordFrame({ id: frameId, loaderId } as any);
    return frame.onLifecycleEvent(name, loaderId);
  }

  private recurseFrameTree(frameTree: FrameTree) {
    const { frame, childFrames } = frameTree;
    this.recordFrame(frame, true);

    this.attachedFrameIds.add(frame.id);

    if (!childFrames) return;
    for (const childFrame of childFrames) {
      this.recurseFrameTree(childFrame);
    }
  }

  private recordFrame(newFrame: Page.Frame, isFrameTreeRecurse = false) {
    const { id, parentId } = newFrame;
    if (this.framesById.has(id)) {
      const frame = this.framesById.get(id);
      if (isFrameTreeRecurse) frame.onLoaded(newFrame);
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

    return frame;
  }
}
