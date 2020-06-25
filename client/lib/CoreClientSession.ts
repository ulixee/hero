import { IInteractionGroups } from '@secret-agent/core-interfaces/IInteractions';
import ISessionMeta from '@secret-agent/core-interfaces/ISessionMeta';
import { ILocationStatus, ILocationTrigger } from '@secret-agent/core-interfaces/Location';
import ISessionOptions from '@secret-agent/core-interfaces/ISessionOptions';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import { ICookie } from '@secret-agent/core-interfaces/ICookie';
import CoreEventHeap from './CoreEventHeap';
import CoreCommandQueue from './CoreCommandQueue';
import CoreClient from './CoreClient';
import IWaitForElementOptions from '@secret-agent/core-interfaces/IWaitForElementOptions';
import IWaitForResourceOptions from '@secret-agent/core-interfaces/IWaitForResourceOptions';
import IWaitForResourceFilter from '@secret-agent/core-interfaces/IWaitForResourceFilter';
import IResourceMeta from '@secret-agent/core-interfaces/IResourceMeta';
import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';
import IExecJsPathResult from '@secret-agent/core/interfaces/IExecJsPathResult';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import IAttachedState from 'awaited-dom/base/IAttachedState';

/////////////////////////////////////////////////////

export default class CoreClientSession {
  public windowId: string;
  public sessionId: string;
  public sessionsDataLocation: string;
  public commandQueue: CoreCommandQueue;
  public eventHeap: CoreEventHeap;
  protected readonly meta: ISessionMeta;
  private coreClient: CoreClient;

  constructor({ windowId, sessionId, sessionsDataLocation }: ISessionMeta, coreClient: CoreClient) {
    this.windowId = windowId;
    this.sessionId = sessionId;
    this.sessionsDataLocation = sessionsDataLocation;
    this.meta = {
      sessionId,
      windowId,
    };
    this.coreClient = coreClient;
    this.commandQueue = new CoreCommandQueue(this.meta, coreClient, coreClient.commandQueue);
    this.eventHeap = new CoreEventHeap(this.meta, coreClient);
  }

  public async getResourceProperty<T = any>(id: number, propertyPath: string): Promise<T> {
    return this.commandQueue.run<T>('getResourceProperty', id, propertyPath);
  }

  public async configure(options: ISessionOptions): Promise<void> {
    await this.commandQueue.run<void>('configure', options);
  }

  public async execJsPath<T = any>(jsPath: IJsPath): Promise<IExecJsPathResult<T>> {
    return await this.commandQueue.run<IExecJsPathResult<T>>('execJsPath', jsPath);
  }

  public async getJsValue<T>(expression: string) {
    return await this.commandQueue.run<{ value: T; type: string }>('getJsValue', expression);
  }

  public async fetch(request: string | number, init?: IRequestInit): Promise<IAttachedState> {
    return await this.commandQueue.run<IAttachedState>('fetch', request, init);
  }

  public async createRequest(input: string | number, init?: IRequestInit): Promise<IAttachedState> {
    return await this.commandQueue.run<IAttachedState>('createRequest', input, init);
  }

  public async getUrl(): Promise<string> {
    return await this.commandQueue
      .run<IExecJsPathResult<string>>('execJsPath', ['location', 'href'])
      .then(x => x.value);
  }

  public async goto(href: string): Promise<IResourceMeta> {
    return await this.commandQueue.run<IResourceMeta>('goto', href);
  }

  public async interact(interactionGroups: IInteractionGroups): Promise<void> {
    await this.commandQueue.run<void>('interact', ...interactionGroups);
  }

  public async exportUserProfile(): Promise<IUserProfile> {
    return await this.commandQueue.run<IUserProfile>('exportUserProfile');
  }

  public async getPageCookies(): Promise<ICookie[]> {
    return await this.commandQueue.run<ICookie[]>('getPageCookies');
  }

  public async getAllCookies(): Promise<ICookie[]> {
    return await this.commandQueue.run<ICookie[]>('getAllCookies');
  }

  public async waitForResource(
    filter: Pick<IWaitForResourceFilter, 'url' | 'type'>,
    opts: IWaitForResourceOptions,
  ): Promise<IResourceMeta[]> {
    return await this.commandQueue.run<IResourceMeta[]>('waitForResource', filter, opts);
  }

  public async waitForElement(jsPath: IJsPath, opts: IWaitForElementOptions): Promise<void> {
    await this.commandQueue.run<void>('waitForElement', jsPath, opts);
  }

  public async waitForLoad(status: ILocationStatus): Promise<void> {
    await this.commandQueue.run<void>('waitForLoad', status);
  }

  public async waitForLocation(trigger: ILocationTrigger): Promise<void> {
    await this.commandQueue.run<void>('waitForLocation', trigger);
  }

  public async waitForMillis(millis: number): Promise<void> {
    await this.commandQueue.run<void>('waitForMillis', millis);
  }

  public async waitForWebSocket(url: string | RegExp): Promise<void> {
    await this.commandQueue.run<void>('waitForWebSocket', url);
  }

  public async addEventListener(
    jsPath: IJsPath | null,
    eventType: string,
    listenerFn: (...args: any[]) => void,
    options?,
  ): Promise<void> {
    await this.eventHeap.addListener(jsPath, eventType, listenerFn, options);
  }

  public async removeEventListener(
    jsPath: IJsPath | null,
    eventType: string,
    listenerFn: (...args: any[]) => void,
    options?,
  ): Promise<void> {
    await this.eventHeap.removeListener(jsPath, eventType, listenerFn, options);
  }

  public async close(): Promise<void> {
    await this.commandQueue.run<void>('close');
    process.nextTick(() => {
      delete this.coreClient.sessionsByWindowId[this.meta.windowId];
    });
  }
}
