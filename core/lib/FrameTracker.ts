import IDevtoolsClient from '../interfaces/IDevtoolsClient';
import Protocol from 'devtools-protocol';
import { IResolvablePromise } from '@secret-agent/commons/utils';
import { exceptionDetailsToError } from './Utils';
import FrameNavigatedEvent = Protocol.Page.FrameNavigatedEvent;
import FrameTree = Protocol.Page.FrameTree;
import Frame = Protocol.Page.Frame;
import FrameDetachedEvent = Protocol.Page.FrameDetachedEvent;
import FrameAttachedEvent = Protocol.Page.FrameAttachedEvent;
import ExecutionContextDestroyedEvent = Protocol.Runtime.ExecutionContextDestroyedEvent;
import ExecutionContextCreatedEvent = Protocol.Runtime.ExecutionContextCreatedEvent;

export default class FrameTracker {
  public frames: { [id: string]: IFrame } = {};

  public get mainFrameId() {
    return Array.from(this.attachedFrameIds).find(id => !this.frames[id].parentId);
  }

  private attachedFrameIds = new Set<string>();
  private frameContexts: {
    [id: string]: {
      worldName: string;
      isActive: boolean;
      executionId?: number;
      waitForPromises: IResolvablePromise[];
    }[];
  } = {};
  private devtoolsClient: IDevtoolsClient;

  constructor(devtoolsClient: IDevtoolsClient) {
    this.devtoolsClient = devtoolsClient;
  }

  public async init() {
    await this.devtoolsClient.send('Page.enable');
    const framesResponse = await this.devtoolsClient.send('Page.getFrameTree');
    this.recurseFrameTree(framesResponse.frameTree);
    this.devtoolsClient.on('Page.frameNavigated', this.onFrameNavigated.bind(this));
    this.devtoolsClient.on('Page.frameDetached', this.onFrameDetached.bind(this));
    this.devtoolsClient.on('Page.frameAttached', this.onFrameAttached.bind(this));
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
        const executionContextId = this.frameContexts[frame.id].find(
          x => x.worldName === worldName && x.isActive,
        )?.executionId;
        origins.push({
          origin: frame.securityOrigin,
          executionId: executionContextId,
        });
      }
    }
    return origins;
  }

  public getActiveContext(worldName: string, frameId: string) {
    return this.frameContexts[frameId].find(x => x.worldName === worldName && x.isActive);
  }

  public getFrameIdForExecutionContext(executionContextId: number) {
    for (const [frameId, contexts] of Object.entries(this.frameContexts)) {
      for (const context of contexts) {
        if (context.executionId === executionContextId) {
          return frameId;
        }
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
            value: await this.runInFrame(expression, frameId, worldName),
          };
        } catch (err) {
          results[frameId] = { error: new Error('Could not execute expression') };
        }
      }),
    );
    return results;
  }

  public async runInFrame(expression: string, frameId: string, worldName: string) {
    const context = this.frameContexts[frameId].find(x => x.isActive && worldName === x.worldName);
    if (!context) {
      throw new Error(
        'Unable to run page script - no context established in frame for isolated world',
      );
    }

    const frameChanges = await this.devtoolsClient.send('Runtime.evaluate', {
      expression,
      contextId: context.executionId,
      returnByValue: true,
      awaitPromise: true,
    });
    if (frameChanges.exceptionDetails) {
      throw exceptionDetailsToError(frameChanges.exceptionDetails);
    }
    if (frameChanges.result?.value) {
      return frameChanges.result?.value;
    }
  }

  private onExecutionContextDestroyed(event: ExecutionContextDestroyedEvent) {
    for (const [_, contexts] of Object.entries(this.frameContexts)) {
      for (const context of contexts) {
        if (context.executionId === event.executionContextId) {
          context.isActive = false;
          return;
        }
      }
    }
  }

  private onExecutionContextCreated(event: ExecutionContextCreatedEvent) {
    const { context } = event;
    const frameId = context.auxData.frameId as string;
    this.frameContexts[frameId] = this.frameContexts[frameId] || [];

    this.frameContexts[frameId].push({
      isActive: true,
      executionId: context.id,
      worldName: context.name,
      waitForPromises: [],
    });
  }

  private onFrameNavigated(navigatedEvent: FrameNavigatedEvent) {
    const frame = navigatedEvent.frame as IFrame;
    frame.hasNavigated = true;
    this.frames[frame.id] = frame;
    this.frameContexts[frame.id] = this.frameContexts[frame.id] || [];
  }

  private onFrameDetached(frameDetachedEvent: FrameDetachedEvent) {
    const { frameId } = frameDetachedEvent;
    this.attachedFrameIds.delete(frameId);
  }

  private onFrameAttached(frameAttachedEvent: FrameAttachedEvent) {
    const { frameId } = frameAttachedEvent;
    this.attachedFrameIds.add(frameId);
  }

  private recurseFrameTree(frameTree: FrameTree) {
    const { frame, childFrames } = frameTree;
    this.frames[frame.id] = frame;
    this.attachedFrameIds.add(frame.id);

    if (!childFrames) return;
    for (const childFrame of childFrames) {
      this.recurseFrameTree(childFrame);
    }
  }
}

interface IFrame extends Frame {
  hasNavigated?: boolean;
}
