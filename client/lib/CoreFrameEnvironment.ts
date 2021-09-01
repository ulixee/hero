import { IInteractionGroups } from '@ulixee/hero-interfaces/IInteractions';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import { ILoadStatus, ILocationTrigger } from '@ulixee/hero-interfaces/Location';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import { ICookie } from '@ulixee/hero-interfaces/ICookie';
import IWaitForElementOptions from '@ulixee/hero-interfaces/IWaitForElementOptions';
import IExecJsPathResult from '@ulixee/hero-interfaces/IExecJsPathResult';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import INodePointer from 'awaited-dom/base/INodePointer';
import ISetCookieOptions from '@ulixee/hero-interfaces/ISetCookieOptions';
import IWaitForOptions from '@ulixee/hero-interfaces/IWaitForOptions';
import IFrameMeta from '@ulixee/hero-interfaces/IFrameMeta';
import CoreCommandQueue from './CoreCommandQueue';

export default class CoreFrameEnvironment {
  public tabId: number;
  public frameId: number;
  public sessionId: string;
  public commandQueue: CoreCommandQueue;

  constructor(meta: ISessionMeta & { sessionName: string }, commandQueue: CoreCommandQueue) {
    const { tabId, sessionId, frameId, sessionName } = meta;
    this.tabId = tabId;
    this.sessionId = sessionId;
    this.frameId = frameId;
    const queueMeta = {
      sessionId,
      tabId,
      sessionName,
      frameId,
    };
    this.commandQueue = commandQueue.createSharedQueue(queueMeta);
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

  public recordDetachedJsPath(index: number, startDate: Date, endDate: Date): void {
    this.commandQueue.record({
      commandId: this.commandQueue.nextCommandId,
      command: 'FrameEnvironment.recordDetachedJsPath',
      args: [index, startDate.getTime(), endDate.getTime()],
    });
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
    await this.commandQueue.run('FrameEnvironment.interact', ...interactionGroups);
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

  public async waitForElement(jsPath: IJsPath, opts: IWaitForElementOptions): Promise<void> {
    await this.commandQueue.run('FrameEnvironment.waitForElement', jsPath, opts);
  }

  public async waitForLoad(status: ILoadStatus, opts: IWaitForOptions): Promise<void> {
    await this.commandQueue.run('FrameEnvironment.waitForLoad', status, opts);
  }

  public async waitForLocation(trigger: ILocationTrigger, opts: IWaitForOptions): Promise<void> {
    await this.commandQueue.run('FrameEnvironment.waitForLocation', trigger, opts);
  }
}
