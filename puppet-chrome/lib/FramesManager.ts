import Protocol from 'devtools-protocol';
import Log from '@secret-agent/commons/Logger';
import { createPromise, IResolvablePromise } from '@secret-agent/commons/utils';
import * as eventUtils from '@secret-agent/commons/eventUtils';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import { URL } from 'url';
import { IPuppetFrameEvents } from '@secret-agent/puppet/interfaces/IPuppetFrame';
import { debugError, exceptionDetailsToError } from './Utils';
import { CDPSession } from './CDPSession';
import { IFrame } from '../interfaces/IFrame';
import FrameNavigatedEvent = Protocol.Page.FrameNavigatedEvent;
import FrameTree = Protocol.Page.FrameTree;
import FrameDetachedEvent = Protocol.Page.FrameDetachedEvent;
import FrameAttachedEvent = Protocol.Page.FrameAttachedEvent;
import ExecutionContextDestroyedEvent = Protocol.Runtime.ExecutionContextDestroyedEvent;
import ExecutionContextCreatedEvent = Protocol.Runtime.ExecutionContextCreatedEvent;
import NavigatedWithinDocumentEvent = Protocol.Page.NavigatedWithinDocumentEvent;
import FrameStoppedLoadingEvent = Protocol.Page.FrameStoppedLoadingEvent;
import LifecycleEventEvent = Protocol.Page.LifecycleEventEvent;
import Frame = Protocol.Page.Frame;
import FrameRequestedNavigationEvent = Protocol.Page.FrameRequestedNavigationEvent;
import FrameStartedLoadingEvent = Protocol.Page.FrameStartedLoadingEvent;

const { log } = Log(module);
const DEFAULT_PAGE = 'about:blank';
export const ISOLATED_WORLD = '__sa_world__';

export default class FramesManager extends TypedEventEmitter<IPuppetFrameEvents> {
  public frames: { [id: string]: IFrame } = {};

  public get mainFrameId() {
    return Array.from(this.attachedFrameIds).find(id => !this.frames[id].parentId);
  }

  public get main() {
    return this.frames[this.mainFrameId];
  }

  public get activeFrames() {
    return Array.from(this.attachedFrameIds).map(x => this.frames[x]);
  }

  private isClosing = false;
  private attachedFrameIds = new Set<string>();
  private activeContexts = new Set<number>();
  private executionContexts: IFrameContext[] = [];
  private pendingContextPromises: {
    frameId: string;
    worldName: string;
    promise: IResolvablePromise<IFrameContext>;
  }[] = [];

  private readonly cdpSession: CDPSession;

  constructor(cdpSession: CDPSession) {
    super();
    this.cdpSession = cdpSession;
    this.cdpSession.on('Page.frameNavigated', this.onFrameNavigated.bind(this));
    this.cdpSession.on(
      'Page.navigatedWithinDocument',
      this.onFrameNavigatedWithinDocument.bind(this),
    );
    this.cdpSession.on('Page.frameRequestedNavigation', this.onFrameRequestedNavigation.bind(this));
    this.cdpSession.on('Page.frameDetached', this.onFrameDetached.bind(this));
    this.cdpSession.on('Page.frameAttached', this.onFrameAttached.bind(this));

    this.cdpSession.on('Page.frameStartedLoading', this.onFrameStartedLoading.bind(this));
    this.cdpSession.on('Page.frameStoppedLoading', this.onFrameStoppedLoading.bind(this));
    this.cdpSession.on('Page.lifecycleEvent', this.onLifecycleEvent.bind(this));

    this.cdpSession.on(
      'Runtime.executionContextsCleared',
      this.onExecutionContextsCleared.bind(this),
    );
    this.cdpSession.on(
      'Runtime.executionContextDestroyed',
      this.onExecutionContextDestroyed.bind(this),
    );
    this.cdpSession.on(
      'Runtime.executionContextCreated',
      this.onExecutionContextCreated.bind(this),
    );
  }

  public async initialize() {
    await Promise.all([
      this.cdpSession.send('Page.enable'),
      this.cdpSession.send('Page.setLifecycleEventsEnabled', { enabled: true }),
      this.cdpSession.send('Runtime.enable'),
    ]);

    const framesResponse = await this.cdpSession.send('Page.getFrameTree');
    await this.recurseFrameTree(framesResponse.frameTree);
  }

  public close() {
    this.isClosing = true;
    for (const promise of this.pendingContextPromises) {
      promise.promise.reject(new Error('Session closing'));
    }
  }

  public getSecurityOrigins() {
    const origins: { origin: string; frameId: string }[] = [];
    for (const frame of Object.values(this.frames)) {
      if (this.attachedFrameIds.has(frame.id) && frame.hasNavigated && frame.url !== DEFAULT_PAGE) {
        let origin = frame.securityOrigin;
        if (!origin || origin === '://') {
          origin = new URL(frame.url).origin;
        }
        if (!origins.some(x => x.origin === origin)) {
          origins.push({ origin, frameId: frame.id });
        }
      }
    }
    return origins;
  }

  public async waitForFrame(
    frameDetails: { frameId: string; loaderId?: string },
    isInitiatingNavigation = false,
  ) {
    const { frameId } = frameDetails;
    const frame = this.frames[frameId];
    if (isInitiatingNavigation) {
      const frameLoading = createPromise();
      // chain current listeners to new promise
      if (frame.frameLoading) frame.frameLoading.resolve(frameLoading.promise);
      frame.frameLoading = frameLoading;
    }
    await frame.frameLoading.promise;
  }

  public getFrameIdForExecutionContext(executionContextId: number) {
    for (const context of this.executionContexts) {
      if (context.executionContextId === executionContextId) {
        return context.frameId;
      }
    }
  }

  /////// RUN ISOLATED SCRIPTS /////////////////////////////////////////////////////////////////////////////////////////

  public async runInActiveFrames(expression: string, runIsolated = true) {
    const activeFrameIds = Array.from(this.attachedFrameIds);

    const results: { [frameId: string]: { error?: Error; value?: any } } = {};
    await Promise.all(
      activeFrameIds.map(async frameId => {
        try {
          results[frameId] = {
            value: await this.runInFrame(frameId, expression, runIsolated),
          };
        } catch (err) {
          results[frameId] = { error: new Error('Could not execute expression') };
        }
      }),
    );
    return results;
  }

  public async runInFrame<T>(frameId: string, expression: string, runIsolated = true) {
    const context = await this.waitForActiveContext(frameId, runIsolated);
    return this.runInContext<T>(expression, context.executionContextId);
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

  private getActiveContext(frameId: string, isolatedContext = false): IFrameContext | undefined {
    const worldName = isolatedContext ? ISOLATED_WORLD : '';
    return this.executionContexts.find(
      x =>
        x.worldName === worldName &&
        x.frameId === frameId &&
        this.activeContexts.has(x.executionContextId),
    );
  }

  private async runInContext<T>(expression: string, contextId: number) {
    const result = await this.cdpSession.send('Runtime.evaluate', {
      expression,
      contextId,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) {
      throw exceptionDetailsToError(result.exceptionDetails);
    }
    if (result.result?.value) {
      return result.result?.value as T;
    }
  }

  private async waitForActiveContext(
    frameId: string,
    getIsolatedContext = true,
  ): Promise<IFrameContext> {
    const frame = this.frames[frameId];
    if (frame?.hasNavigated && frame?.url !== DEFAULT_PAGE) {
      await frame.frameLoading.promise;
    }
    const existing = this.getActiveContext(frameId, getIsolatedContext);
    if (existing) return existing;

    const worldName = getIsolatedContext ? ISOLATED_WORLD : '';
    const resolvable = createPromise<IFrameContext>();
    this.pendingContextPromises.push({
      worldName,
      frameId,
      promise: resolvable,
    });
    return resolvable.promise;
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

    this.addActiveContext(frameId, context.id, context.name);
  }

  /////// FRAMES ///////////////////////////////////////////////////////////////

  private async onFrameNavigated(navigatedEvent: FrameNavigatedEvent) {
    const { frame } = navigatedEvent;
    if (!this.frames[frame.id]) {
      this.recordFrame(frame);
      await this.createIsolatedWorld(frame.id);
    } else {
      const stored = this.frames[frame.id];
      stored.url = frame.url;
      stored.hasNavigated = true;
    }
    setImmediate(framePromise => framePromise.resolve(), this.frames[frame.id].frameLoading);

    this.emit('frameNavigated', {
      frame: this.frames[frame.id],
    });
  }

  private async onFrameStartedLoading(event: FrameStartedLoadingEvent) {
    const { frameId } = event;
    const frame = this.frames[frameId];
    if (!frame) {
      await this.createIsolatedWorld(frame.id);
      debugError('No frame for frameStartedLoading', event);
      return;
    }
    const frameLoading = createPromise();
    // chain current listeners to new promise
    if (frame.frameLoading) frame.frameLoading.resolve(frameLoading.promise);
    frame.frameLoading = frameLoading;
  }

  private onFrameRequestedNavigation(navigatedEvent: FrameRequestedNavigationEvent) {
    const { frameId, url, reason } = navigatedEvent;
    const frame = this.frames[frameId];
    if (frame) {
      this.emit('frameRequestedNavigation', { frame, url, reason });
    }
  }

  private onFrameNavigatedWithinDocument(navigatedEvent: NavigatedWithinDocumentEvent) {
    const { frameId, url } = navigatedEvent;
    const frame = this.frames[frameId];
    if (frame && url !== DEFAULT_PAGE) {
      frame.url = url;
      frame.hasNavigated = true;
      this.emit('frameNavigated', { frame, navigatedInDocument: true });
    }
  }

  private onFrameDetached(frameDetachedEvent: FrameDetachedEvent) {
    const { frameId } = frameDetachedEvent;
    this.attachedFrameIds.delete(frameId);
  }

  private async onFrameAttached(frameAttachedEvent: FrameAttachedEvent) {
    const { frameId, parentFrameId } = frameAttachedEvent;

    this.recordFrame({ id: frameId, parentId: parentFrameId } as any);
    this.attachedFrameIds.add(frameId);
    await this.createIsolatedWorld(frameId);
  }

  private onFrameStoppedLoading(event: FrameStoppedLoadingEvent) {
    const { frameId } = event;

    const frame = this.frames[frameId];
    if (!frame) return;

    // resolve loading in case it didn't succeed
    frame.frameLoading.resolve();
    frame.hasNavigated = true;
    const events = frame.lifecycleEvents;
    if (!events.DOMContentLoaded) events.DOMContentLoaded = new Date();
    if (!events.load) {
      events.load = new Date();
      this.emit('frameLifecycle', { frame, name: 'load' });
    }
  }

  private onLifecycleEvent(event: LifecycleEventEvent) {
    const { frameId, name, loaderId } = event;
    const frame = this.recordFrame({ id: frameId, loaderId, name } as any);

    if (name === 'init') {
      if (frame.loaderId === loaderId) return;
      frame.loaderId = loaderId;
      frame.lifecycleEvents = {};
    }
    frame.lifecycleEvents[name] = new Date();
    this.emit('frameLifecycle', { frame, name });
  }

  private async recurseFrameTree(frameTree: FrameTree) {
    const { frame, childFrames } = frameTree;
    this.recordFrame(frame);

    this.attachedFrameIds.add(frame.id);

    await this.createIsolatedWorld(frame.id);

    if (!childFrames) return;
    for (const childFrame of childFrames) {
      await this.recurseFrameTree(childFrame);
    }
  }

  private recordFrame(newFrame: Frame) {
    if (this.frames[newFrame.id]) return this.frames[newFrame.id];
    const frame: IFrame = {
      ...newFrame,
      lifecycleEvents: {},
      frameLoading: createPromise(),
      hasNavigated: !!newFrame.url,
      run: this.runInFrame.bind(this, newFrame.id),
    };
    this.frames[frame.id] = frame;
    this.emit('frameCreated', { frame });
    return frame;
  }

  private async createIsolatedWorld(frameId: string) {
    try {
      const isolatedWorld = await this.cdpSession.send('Page.createIsolatedWorld', {
        frameId,
        worldName: ISOLATED_WORLD,
        // param is misspelled in protocol
        grantUniveralAccess: true,
      });
      this.addActiveContext(frameId, isolatedWorld.executionContextId, ISOLATED_WORLD);
    } catch (err) {
      log.warn('Failed to create isolated world.', err);
    }
  }

  private addActiveContext(frameId: string, executionContextId: number, worldName: string) {
    this.activeContexts.add(executionContextId);
    let context = this.executionContexts.find(x => x.executionContextId === executionContextId);
    if (!context) {
      context = {
        frameId,
        executionContextId,
        worldName,
      };
      this.executionContexts.push(context);
    }

    const pendingContextPromises = this.pendingContextPromises;
    this.pendingContextPromises = [];
    for (const pending of pendingContextPromises) {
      if (pending.frameId === frameId && pending.worldName === worldName) {
        pending.promise.resolve(context);
      } else {
        this.pendingContextPromises.push(pending);
      }
    }
  }
}

interface IFrameContext {
  frameId: string;
  worldName: string;
  executionContextId: number;
}
