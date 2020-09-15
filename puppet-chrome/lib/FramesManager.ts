import Protocol from "devtools-protocol";
import * as eventUtils from "@secret-agent/commons/eventUtils";
import { IRegisteredEventListener, TypedEventEmitter } from "@secret-agent/commons/eventUtils";
import { IPuppetFrameEvents } from "@secret-agent/puppet/interfaces/IPuppetFrame";
import { debug } from "@secret-agent/commons/Debug";
import { CDPSession } from "./CDPSession";
import Frame from "./Frame";
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
const debugError = debug('puppet-chrome:frames-error');

export default class FramesManager extends TypedEventEmitter<IPuppetFrameEvents> {
  public frames: { [id: string]: Frame } = {};

  public get mainFrameId() {
    return Array.from(this.attachedFrameIds).find(id => !this.frames[id].parentId);
  }

  public get main() {
    return this.frames[this.mainFrameId];
  }

  public get activeFrames() {
    return Array.from(this.attachedFrameIds).map(x => this.frames[x]);
  }

  private attachedFrameIds = new Set<string>();
  private activeContexts = new Set<number>();

  private registeredEvents: IRegisteredEventListener[] = [];
  private readonly cdpSession: CDPSession;

  constructor(cdpSession: CDPSession) {
    super();
    this.cdpSession = cdpSession;
  }

  public async initialize() {
    const framesResponse = await this.cdpSession.send('Page.getFrameTree');
    await this.recurseFrameTree(framesResponse.frameTree);
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
    await Promise.all([
      this.cdpSession.send('Page.enable'),
      this.cdpSession.send('Page.setLifecycleEventsEnabled', { enabled: true }),
      this.cdpSession.send('Runtime.enable'),
    ]);
  }

  public close() {
    eventUtils.removeEventListeners(this.registeredEvents);
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
  }

  /////// EXECUTION CONTEXT ////////////////////////////////////////////////////

  public getSecurityOrigins() {
    const origins: { origin: string; frameId: string }[] = [];
    for (const frame of Object.values(this.frames)) {
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
    const frame = this.frames[frameId];
    if (isInitiatingNavigation) {
      frame.initiateNavigation(url, loaderId);
    }
    await frame.waitForLoader(loaderId);
  }

  public getFrameIdForExecutionContext(executionContextId: number) {
    for (const frame of Object.values(this.frames)) {
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
    const frame = this.frames[frameId];
    frame?.addContextId(context.id, context.name === '');
  }

  /////// FRAMES ///////////////////////////////////////////////////////////////

  private onFrameNavigated(navigatedEvent: FrameNavigatedEvent) {
    const frame = this.recordFrame(navigatedEvent.frame);
    frame.onNavigated(navigatedEvent.frame);
  }

  private onFrameStoppedLoading(event: FrameStoppedLoadingEvent) {
    const { frameId } = event;

    this.frames[frameId].onStoppedLoading();
  }

  private onFrameRequestedNavigation(navigatedEvent: FrameRequestedNavigationEvent) {
    const { frameId, url, reason, disposition } = navigatedEvent;
    this.frames[frameId].requestedNavigation(url, reason, disposition);
  }

  private onFrameNavigatedWithinDocument(navigatedEvent: NavigatedWithinDocumentEvent) {
    const { frameId, url } = navigatedEvent;
    this.frames[frameId].onNavigatedWithinDocument(url);
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
    if (this.frames[id]) return this.frames[id];

    const frame = Frame.create(newFrame, this.activeContexts, this.cdpSession, () =>
      this.attachedFrameIds.has(id),
    );
    this.frames[id] = frame;
    const registered = eventUtils.addEventListeners(frame, [
      [
        'frameLifecycle',
        x =>
          this.emit('frameLifecycle', {
            frame,
            ...x,
          }),
      ],
      [
        'frameNavigated',
        x =>
          this.emit('frameNavigated', {
            frame,
            ...x,
          }),
      ],
      [
        'frameRequestedNavigation',
        x =>
          this.emit('frameRequestedNavigation', {
            frame,
            ...x,
          }),
      ],
    ]);
    this.registeredEvents.push(...registered);

    this.emit('frameCreated', { frame });
    return frame;
  }
}
