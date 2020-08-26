import Protocol from 'devtools-protocol';
import Log from '@secret-agent/commons/Logger';
import { createPromise, IResolvablePromise } from '@secret-agent/commons/utils';
import SessionState from '@secret-agent/session-state';
import IDevtoolsClient from '../interfaces/IDevtoolsClient';
import { exceptionDetailsToError } from './Utils';
import DomEnv from './DomEnv';
import FrameNavigatedEvent = Protocol.Page.FrameNavigatedEvent;
import FrameTree = Protocol.Page.FrameTree;
import Frame = Protocol.Page.Frame;
import FrameDetachedEvent = Protocol.Page.FrameDetachedEvent;
import FrameAttachedEvent = Protocol.Page.FrameAttachedEvent;
import ExecutionContextDestroyedEvent = Protocol.Runtime.ExecutionContextDestroyedEvent;
import ExecutionContextCreatedEvent = Protocol.Runtime.ExecutionContextCreatedEvent;

const { log } = Log(module);

export default class FrameTracker {
  public frames: { [id: string]: IFrame } = {};
  public get mainFrameId() {
    return Array.from(this.attachedFrameIds).find(id => !this.frames[id].parentId);
  }

  private isClosing = false;
  private attachedFrameIds = new Set<string>();
  private activeContexts = new Set<number>();
  private executionContexts: IFrameContext[] = [];
  private devtoolsClient: IDevtoolsClient;
  private sessionState: SessionState;

  private pendingContextPromises: {
    frameId: string;
    worldName: string;
    promise: IResolvablePromise<IFrameContext>;
  }[] = [];

  constructor(devtoolsClient: IDevtoolsClient, sessionState: SessionState) {
    this.devtoolsClient = devtoolsClient;
    this.sessionState = sessionState;
  }

  public async init() {
    await this.devtoolsClient.send('Page.enable');
    const framesResponse = await this.devtoolsClient.send('Page.getFrameTree');
    await this.recurseFrameTree(framesResponse.frameTree);
    this.devtoolsClient.on('Page.frameNavigated', this.onFrameNavigated.bind(this));
    this.devtoolsClient.on('Page.frameDetached', this.onFrameDetached.bind(this));
    this.devtoolsClient.on('Page.frameAttached', this.onFrameAttached.bind(this));
    this.devtoolsClient.on(
      'Runtime.executionContextsCleared',
      this.onExecutionContextsCleared.bind(this),
    );
    this.devtoolsClient.on(
      'Runtime.executionContextDestroyed',
      this.onExecutionContextDestroyed.bind(this),
    );
    this.devtoolsClient.on(
      'Runtime.executionContextCreated',
      this.onExecutionContextCreated.bind(this),
    );
  }

  public getSecurityOrigins(worldName: string) {
    const origins: { origin: string; executionId: number }[] = [];
    for (const frame of Object.values(this.frames)) {
      if (this.attachedFrameIds.has(frame.id) && frame.hasNavigated) {
        const executionContextId = this.getActiveContext(worldName, frame.id)?.executionContextId;
        origins.push({
          origin: frame.securityOrigin,
          executionId: executionContextId,
        });
      }
    }
    return origins;
  }

  public getActiveContext(worldName: string, frameId: string): IFrameContext | undefined {
    return this.executionContexts.find(
      x =>
        x.worldName === worldName &&
        x.frameId === frameId &&
        this.activeContexts.has(x.executionContextId),
    );
  }

  public getFrameIdForExecutionContext(executionContextId: number) {
    for (const context of this.executionContexts) {
      if (context.executionContextId === executionContextId) {
        return context.frameId;
      }
    }
  }

  public async runInActiveFrames(expression: string, worldName: string) {
    const activeFrameIds = Array.from(this.attachedFrameIds);

    const results: { [frameId: string]: { error?: Error; value?: any } } = {};
    await Promise.all(
      activeFrameIds.map(async frameId => {
        try {
          results[frameId] = {
            value: await this.runInFrameWorld(expression, frameId, worldName),
          };
        } catch (err) {
          results[frameId] = { error: new Error('Could not execute expression') };
        }
      }),
    );
    return results;
  }

  public async runInFrameWorld<T>(expression: string, frameId: string, worldName: string) {
    const context = await this.waitForActiveContext(worldName, frameId);
    const result = await this.devtoolsClient.send('Runtime.evaluate', {
      expression,
      contextId: context.executionContextId,
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

  public async waitForActiveContext(worldName: string, frameId: string): Promise<IFrameContext> {
    const existing = this.getActiveContext(worldName, frameId);
    if (existing) return existing;
    const resolvable = createPromise<IFrameContext>();
    this.pendingContextPromises.push({
      worldName,
      frameId,
      promise: resolvable,
    });
    return resolvable.promise;
  }

  public close() {
    this.isClosing = true;
    for (const promise of this.pendingContextPromises) {
      promise.promise.reject(new Error('Session closing'));
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

    this.addActiveContext(frameId, context.id, context.name);
  }

  private async onFrameNavigated(navigatedEvent: FrameNavigatedEvent) {
    const frame = navigatedEvent.frame as IFrame;
    frame.hasNavigated = true;
    this.frames[frame.id] = frame;

    await this.createIsolatedWorld(frame.id);
  }

  private onFrameDetached(frameDetachedEvent: FrameDetachedEvent) {
    const { frameId } = frameDetachedEvent;
    this.attachedFrameIds.delete(frameId);
  }

  private async onFrameAttached(frameAttachedEvent: FrameAttachedEvent) {
    const { frameId, parentFrameId } = frameAttachedEvent;

    this.recordFrame(frameId, parentFrameId);
    this.attachedFrameIds.add(frameId);
    await this.createIsolatedWorld(frameId);
  }

  private async recurseFrameTree(frameTree: FrameTree) {
    const { frame, childFrames } = frameTree;
    this.recordFrame(frame.id, frame.parentId);

    this.frames[frame.id] = frame;
    this.attachedFrameIds.add(frame.id);

    await this.createIsolatedWorld(frame.id);

    if (!childFrames) return;
    for (const childFrame of childFrames) {
      await this.recurseFrameTree(childFrame);
    }
  }

  private recordFrame(frameId: string, parentFrameId?: string) {
    if (this.frames[frameId]) return;
    this.sessionState.captureFrameCreated(frameId, parentFrameId);
  }

  private async createIsolatedWorld(frameId: string) {
    try {
      const isolatedWorld = await this.devtoolsClient.send('Page.createIsolatedWorld', {
        frameId,
        worldName: DomEnv.installedDomWorldName,
        // param is misspelled in protocol
        grantUniveralAccess: true,
      });
      this.addActiveContext(
        frameId,
        isolatedWorld.executionContextId,
        DomEnv.installedDomWorldName,
      );
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

interface IFrame extends Frame {
  hasNavigated?: boolean;
}
interface IFrameContext {
  frameId: string;
  worldName: string;
  executionContextId: number;
}
