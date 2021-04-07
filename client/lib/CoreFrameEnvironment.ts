import { IInteractionGroups } from '@secret-agent/core-interfaces/IInteractions';
import ISessionMeta from '@secret-agent/core-interfaces/ISessionMeta';
import { ILocationStatus, ILocationTrigger } from '@secret-agent/core-interfaces/Location';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import { ICookie } from '@secret-agent/core-interfaces/ICookie';
import IWaitForElementOptions from '@secret-agent/core-interfaces/IWaitForElementOptions';
import IExecJsPathResult from '@secret-agent/core-interfaces/IExecJsPathResult';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import IAttachedState from 'awaited-dom/base/IAttachedState';
import ISetCookieOptions from '@secret-agent/core-interfaces/ISetCookieOptions';
import IWaitForOptions from '@secret-agent/core-interfaces/IWaitForOptions';
import IFrameMeta from '@secret-agent/core-interfaces/IFrameMeta';
import CoreCommandQueue from './CoreCommandQueue';

export default class CoreFrameEnvironment {
  public tabId: number;
  public frameId: string;
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

  public async getJsValue<T>(expression: string): Promise<T> {
    return await this.commandQueue.run('FrameEnvironment.getJsValue', expression);
  }

  public async fetch(request: string | number, init?: IRequestInit): Promise<IAttachedState> {
    return await this.commandQueue.run('FrameEnvironment.fetch', request, init);
  }

  public async createRequest(input: string | number, init?: IRequestInit): Promise<IAttachedState> {
    return await this.commandQueue.run('FrameEnvironment.createRequest', input, init);
  }

  public async getUrl(): Promise<string> {
    return await this.commandQueue.run('FrameEnvironment.getLocationHref');
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

  public async isElementVisible(jsPath: IJsPath): Promise<boolean> {
    return await this.commandQueue.run('FrameEnvironment.isElementVisible', jsPath);
  }

  public async waitForElement(jsPath: IJsPath, opts: IWaitForElementOptions): Promise<void> {
    await this.commandQueue.run('FrameEnvironment.waitForElement', jsPath, opts);
  }

  public async waitForLoad(status: ILocationStatus, opts: IWaitForOptions): Promise<void> {
    await this.commandQueue.run('FrameEnvironment.waitForLoad', status, opts);
  }

  public async waitForLocation(trigger: ILocationTrigger, opts: IWaitForOptions): Promise<void> {
    await this.commandQueue.run('FrameEnvironment.waitForLocation', trigger, opts);
  }
}
