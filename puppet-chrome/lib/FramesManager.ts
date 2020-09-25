import Protocol from 'devtools-protocol';
import * as eventUtils from '@secret-agent/commons/eventUtils';
import { IRegisteredEventListener, TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import { IPuppetFrameEvents } from '@secret-agent/puppet/interfaces/IPuppetFrame';
import { CDPSession } from './CDPSession';
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

export default class FramesManager extends TypedEventEmitter<IPuppetFrameEvents> {
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

  private attachedFrameIds = new Set<string>();
  private activeContexts = new Set<number>();

  private readonly registeredEvents: IRegisteredEventListener[] = [];
  private readonly cdpSession: CDPSession;

  constructor(cdpSession: CDPSession) {
    super();
    this.cdpSession = cdpSession;
    this.registeredEvents = eventUtils.addEventListeners(this.cdpSession, [
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

  public async initialize() {
    const framesResponse = await this.cdpSession.send('Page.getFrameTree');
    await this.recurseFrameTree(framesResponse.frameTree);
    await Promise.all([
      this.cdpSession.send('Page.enable'),
      this.cdpSession.send('Page.setLifecycleEventsEnabled', { enabled: true }),
      this.cdpSession.send('Runtime.enable'),
    ]);
  }

  public close() {
    eventUtils.removeEventListeners(this.registeredEvents);
    this.cancelPendingEvents('Page closed');
    for (const frame of this.framesById.values()) {
      frame.cancelPendingEvents('Page closed');
    }
  }

  public async addPageCallback(name: string, onCallback: (payload: any, frameId: string) => any) {
    // add binding to every new context automatically
    await this.cdpSession.send('Runtime.addBinding', {
      name,
    });
    return eventUtils.addEventListener(this.cdpSession, 'Runtime.bindingCalled', event => {
      if (event.name === name) {
        const frameId = this.getFrameIdForExecutionContext(event.executionContextId);
        onCallback(event.payload, frameId);
      }
    });
  }

  public async addNewDocumentScript(script: string, installInIsolatedScope = true) {
    await this.cdpSession.send('Page.addScriptToEvaluateOnNewDocument', {
      source: script,
      worldName: installInIsolatedScope ? ISOLATED_WORLD : undefined,
    });

    // sometimes we get a new anchor link that already has an initiated frame. If that's the case, newDocumentScripts won't trigger.
    // NOTE: we DON'T want this to trigger for internal pages (':', 'about:blank')
    if (this.main.url?.startsWith('http')) {
      await this.main.evaluate(script, installInIsolatedScope);
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
    const { frameId, loaderId } = frameDetails;
    const frame = this.framesById.get(frameId);
    if (isInitiatingNavigation) {
      frame.initiateNavigation(url, loaderId);
    }
    await frame.waitForLoader(loaderId);
  }

  public getFrameIdForExecutionContext(executionContextId: number) {
    for (const frame of this.framesById.values()) {
      if (frame.hasContextId(executionContextId)) return frame.id;
    }
  }

  private onExecutionContextDestroyed(event: ExecutionContextDestroyedEvent) {
    this.activeContexts.delete(event.executionContextId);
  }

  private onExecutionContextsCleared() {
    this.activeContexts.clear();
  }

  private onExecutionContextCreated(event: ExecutionContextCreatedEvent) {
    const { context } = event;
    const frameId = context.auxData.frameId as string;

    this.activeContexts.add(context.id);
    const frame = this.framesById.get(frameId);
    frame?.addContextId(context.id, context.name === '');
  }

  /////// FRAMES ///////////////////////////////////////////////////////////////

  private onFrameNavigated(navigatedEvent: FrameNavigatedEvent) {
    const frame = this.recordFrame(navigatedEvent.frame);
    frame.onNavigated(navigatedEvent.frame);
  }

  private onFrameStoppedLoading(event: FrameStoppedLoadingEvent) {
    const { frameId } = event;

    this.framesById.get(frameId).onStoppedLoading();
  }

  private onFrameRequestedNavigation(navigatedEvent: FrameRequestedNavigationEvent) {
    const { frameId, url, reason, disposition } = navigatedEvent;
    this.framesById.get(frameId).requestedNavigation(url, reason, disposition);
  }

  private onFrameNavigatedWithinDocument(navigatedEvent: NavigatedWithinDocumentEvent) {
    const { frameId, url } = navigatedEvent;
    this.framesById.get(frameId).onNavigatedWithinDocument(url);
  }

  private onFrameDetached(frameDetachedEvent: FrameDetachedEvent) {
    const { frameId } = frameDetachedEvent;
    this.attachedFrameIds.delete(frameId);
  }

  private onFrameAttached(frameAttachedEvent: FrameAttachedEvent) {
    const { frameId, parentFrameId } = frameAttachedEvent;

    this.recordFrame({ id: frameId, parentId: parentFrameId } as any);
    this.attachedFrameIds.add(frameId);
  }

  private onLifecycleEvent(event: LifecycleEventEvent) {
    const { frameId, name, loaderId } = event;
    const frame = this.recordFrame({ id: frameId, loaderId, name } as any);
    return frame.onLifecycleEvent(name, loaderId);
  }

  private recurseFrameTree(frameTree: FrameTree) {
    const { frame, childFrames } = frameTree;
    this.recordFrame(frame);

    this.attachedFrameIds.add(frame.id);

    if (!childFrames) return;
    for (const childFrame of childFrames) {
      this.recurseFrameTree(childFrame);
    }
  }

  private recordFrame(newFrame: Page.Frame) {
    const { id } = newFrame;
    if (this.framesById.has(id)) return this.framesById.get(id);

    const frame = Frame.create(newFrame, this.activeContexts, this.cdpSession, () =>
      this.attachedFrameIds.has(id),
    );
    this.framesById.set(id, frame);
    this.emit('frame-created', { frame });

    const registered = eventUtils.addEventListeners(frame, [
      [
        'frame-lifecycle',
        x =>
          this.emit('frame-lifecycle', {
            frame,
            ...x,
          }),
      ],
      [
        'frame-navigated',
        x =>
          this.emit('frame-navigated', {
            frame,
            ...x,
          }),
      ],
      [
        'frame-requested-navigation',
        x =>
          this.emit('frame-requested-navigation', {
            frame,
            ...x,
          }),
      ],
    ]);
    this.registeredEvents.push(...registered);
    return frame;
  }
}
