import {
  IInteractionGroups,
  isMousePositionXY,
} from '@unblocked-web/specifications/agent/interact/IInteractions';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import {
  ILoadStatus,
  ILocationTrigger,
} from '@unblocked-web/specifications/agent/browser/Location';
import { IJsPath, INodeVisibility, INodePointer } from '@unblocked-web/js-path';
import AwaitedPath from 'awaited-dom/base/AwaitedPath';
import { ICookie } from '@unblocked-web/specifications/agent/net/ICookie';
import IWaitForElementOptions from '@ulixee/hero-interfaces/IWaitForElementOptions';
import IExecJsPathResult from '@unblocked-web/specifications/agent/browser/IExecJsPathResult';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import ISetCookieOptions from '@ulixee/hero-interfaces/ISetCookieOptions';
import {
  getComputedVisibilityFnName,
  isFocusedFnName,
} from '@unblocked-web/specifications/agent/browser/IJsPathFunctions';
import IWaitForOptions from '@ulixee/hero-interfaces/IWaitForOptions';
import IFrameMeta from '@ulixee/hero-interfaces/IFrameMeta';
import IResourceMeta from '@unblocked-web/specifications/agent/net/IResourceMeta';
import StateMachine from 'awaited-dom/base/StateMachine';
import { IElementIsolate, INodeIsolate } from 'awaited-dom/base/interfaces/isolate';
import { ISuperElement } from 'awaited-dom/base/interfaces/super';
import TimeoutError from '@ulixee/commons/interfaces/TimeoutError';
import ICollectedElement from '@ulixee/hero-interfaces/ICollectedElement';
import IAwaitedOptions from '../interfaces/IAwaitedOptions';
import CoreCommandQueue from './CoreCommandQueue';
import CoreTab from './CoreTab';
import {
  convertJsPathArgs,
  createInstanceWithNodePointer,
  delegate as AwaitedHandler,
} from './SetupAwaitedHandler';

const awaitedPathState = StateMachine<
  any,
  { awaitedPath: AwaitedPath; awaitedOptions: IAwaitedOptions; nodePointer?: INodePointer }
>();

export default class CoreFrameEnvironment {
  public tabId: number;
  public frameId: number;
  public sessionId: string;
  public commandQueue: CoreCommandQueue;
  public parentFrameId: number;
  public coreTab: CoreTab;

  constructor(
    coreTab: CoreTab,
    meta: ISessionMeta & { sessionName: string },
    parentFrameId?: number,
  ) {
    const { tabId, sessionId, frameId, sessionName } = meta;
    this.tabId = tabId;
    this.coreTab = coreTab;
    this.sessionId = sessionId;
    this.frameId = frameId;
    this.parentFrameId = parentFrameId;
    const queueMeta = {
      sessionId,
      tabId,
      sessionName,
      frameId,
    };
    this.commandQueue = coreTab.commandQueue.createSharedQueue(queueMeta);
  }

  public async getFrameMeta(): Promise<IFrameMeta> {
    return await this.commandQueue.run('FrameEnvironment.meta');
  }

  public async getChildFrameEnvironment(jsPath: IJsPath): Promise<IFrameMeta> {
    return await this.commandQueue.run('FrameEnvironment.getChildFrameEnvironment', jsPath);
  }

  public async execJsPath<T = any>(jsPath: IJsPath): Promise<IExecJsPathResult<T>> {
    return await this.commandQueue.run('FrameEnvironment.execJsPath', jsPath);
  }

  public async getJsValue<T>(expression: string): Promise<T> {
    return await this.commandQueue.run('FrameEnvironment.getJsValue', expression);
  }

  public async fetch(request: string | number, init?: IRequestInit): Promise<INodePointer> {
    return await this.commandQueue.run('FrameEnvironment.fetch', request, init);
  }

  public async createRequest(input: string | number, init?: IRequestInit): Promise<INodePointer> {
    return await this.commandQueue.run('FrameEnvironment.createRequest', input, init);
  }

  public async collectElement(
    name: string,
    jsPath: IJsPath,
    waitForElement = false,
  ): Promise<ICollectedElement[]> {
    return await this.commandQueue.run(
      'FrameEnvironment.collectElement',
      name,
      jsPath,
      Date.now(),
      waitForElement,
    );
  }

  public async getUrl(): Promise<string> {
    return await this.commandQueue.run('FrameEnvironment.getUrl');
  }

  public async isPaintingStable(): Promise<boolean> {
    return await this.commandQueue.run('FrameEnvironment.isPaintingStable');
  }

  public async isDomContentLoaded(): Promise<boolean> {
    return await this.commandQueue.run('FrameEnvironment.isDomContentLoaded');
  }

  public async isAllContentLoaded(): Promise<boolean> {
    return await this.commandQueue.run('FrameEnvironment.isAllContentLoaded');
  }

  public async interact(interactionGroups: IInteractionGroups): Promise<void> {
    for (const interactionGroup of interactionGroups) {
      for (const interactionStep of interactionGroup) {
        if (interactionStep.mousePosition && !isMousePositionXY(interactionStep.mousePosition)) {
          convertJsPathArgs(interactionStep.mousePosition);
        }
      }
    }
    await this.commandQueue.run('FrameEnvironment.interact', ...interactionGroups);
  }

  public async getComputedVisibility(node: INodeIsolate): Promise<INodeVisibility> {
    return await AwaitedHandler.runMethod(awaitedPathState, node, getComputedVisibilityFnName, []);
  }

  public async isFocused(element: IElementIsolate): Promise<boolean> {
    return await AwaitedHandler.runMethod(awaitedPathState, element, isFocusedFnName, []);
  }

  public async getNodePointer(node: INodeIsolate): Promise<INodePointer> {
    return await AwaitedHandler.createNodePointer(awaitedPathState, node);
  }

  public async getCookies(): Promise<ICookie[]> {
    return await this.commandQueue.run('FrameEnvironment.getCookies');
  }

  public async setCookie(
    name: string,
    value: string,
    options?: ISetCookieOptions,
  ): Promise<boolean> {
    return await this.commandQueue.run('FrameEnvironment.setCookie', name, value, options);
  }

  public async removeCookie(name: string): Promise<boolean> {
    return await this.commandQueue.run('FrameEnvironment.removeCookie', name);
  }

  public async setFileInputFiles(
    jsPath: IJsPath,
    files: { name: string; data: Buffer }[],
  ): Promise<void> {
    return await this.commandQueue.run('FrameEnvironment.setFileInputFiles', jsPath, files);
  }

  public async waitForElement(
    element: ISuperElement,
    options: IWaitForElementOptions,
  ): Promise<ISuperElement> {
    if (!element) throw new Error('Element being waited for is null');
    const { waitForVisible, waitForHidden, waitForClickable, timeoutMs } = options ?? {};
    try {
      await this.coreTab.waitForState(
        {
          all(assert) {
            if (waitForVisible) assert(element.$isVisible);
            else if (waitForClickable) assert(element.$isClickable);
            else if (waitForHidden) assert(element.$isVisible, false);
            else assert(element.$exists);
          },
        },
        { timeoutMs },
      );
    } catch (error) {
      if (error instanceof TimeoutError) {
        let state: string;
        if (waitForHidden) state = 'be hidden';
        else if (waitForClickable) state = 'be clickable';
        else if (waitForVisible) state = 'be visible';
        else state = 'exist';
        throw new TimeoutError(`Timeout waiting for element to ${state}`);
      }
      throw error;
    }

    const nodePointer = await this.getNodePointer(element);
    if (!nodePointer) return null;
    const { awaitedOptions, awaitedPath } = awaitedPathState.getState(element);

    return createInstanceWithNodePointer(
      awaitedPathState,
      awaitedPath,
      awaitedOptions,
      nodePointer,
    );
  }

  public async waitForLoad(status: ILoadStatus, opts: IWaitForOptions): Promise<void> {
    await this.commandQueue.run('FrameEnvironment.waitForLoad', status, opts);
  }

  public async waitForLocation(
    trigger: ILocationTrigger,
    opts: IWaitForOptions,
  ): Promise<IResourceMeta> {
    return await this.commandQueue.run('FrameEnvironment.waitForLocation', trigger, opts);
  }
}
