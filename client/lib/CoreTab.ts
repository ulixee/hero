import { IInteractionGroups } from '@secret-agent/core-interfaces/IInteractions';
import ISessionMeta from '@secret-agent/core-interfaces/ISessionMeta';
import { ILocationStatus, ILocationTrigger } from '@secret-agent/core-interfaces/Location';
import ISessionOptions from '@secret-agent/core-interfaces/ISessionOptions';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import { ICookie } from '@secret-agent/core-interfaces/ICookie';
import IWaitForElementOptions from '@secret-agent/core-interfaces/IWaitForElementOptions';
import IWaitForResourceOptions from '@secret-agent/core-interfaces/IWaitForResourceOptions';
import IResourceMeta from '@secret-agent/core-interfaces/IResourceMeta';
import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';
import IExecJsPathResult from '@secret-agent/core/interfaces/IExecJsPathResult';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import IAttachedState from 'awaited-dom/base/IAttachedState';
import CoreClient from './CoreClient';
import CoreCommandQueue from './CoreCommandQueue';
import CoreEventHeap from './CoreEventHeap';
import IWaitForResourceFilter from '../interfaces/IWaitForResourceFilter';
import { createResource } from './Resource';

export default class CoreTab {
  public tabId: string;
  public sessionId: string;
  public sessionsDataLocation: string;
  public replayApiServer: string;
  public commandQueue: CoreCommandQueue;
  public eventHeap: CoreEventHeap;
  protected readonly meta: ISessionMeta;
  private readonly coreClient: CoreClient;

  constructor(
    { tabId, sessionId, sessionsDataLocation, replayApiServer }: ISessionMeta,
    coreClient: CoreClient,
  ) {
    this.tabId = tabId;
    this.sessionId = sessionId;
    this.sessionsDataLocation = sessionsDataLocation;
    this.replayApiServer = replayApiServer;
    this.meta = {
      sessionId,
      tabId,
    };
    this.coreClient = coreClient;
    this.commandQueue = new CoreCommandQueue(this.meta, coreClient, coreClient.commandQueue);
    this.eventHeap = new CoreEventHeap(this.meta, coreClient);

    if (!this.eventHeap.hasEventInterceptors('resource')) {
      this.eventHeap.registerEventInterceptor('resource', (resource: IResourceMeta) => {
        return [createResource(resource, this)];
      });
    }
  }

  public async getResourceProperty<T = any>(id: number, propertyPath: string): Promise<T> {
    return this.commandQueue.run('getResourceProperty', id, propertyPath);
  }

  public async configure(options: ISessionOptions): Promise<void> {
    await this.commandQueue.run('configure', options);
  }

  public async execJsPath<T = any>(jsPath: IJsPath): Promise<IExecJsPathResult<T>> {
    return await this.commandQueue.run('execJsPath', jsPath);
  }

  public async getJsValue<T>(expression: string): Promise<{ value: T; type: string }> {
    return await this.commandQueue.run('getJsValue', expression);
  }

  public async fetch(request: string | number, init?: IRequestInit): Promise<IAttachedState> {
    return await this.commandQueue.run('fetch', request, init);
  }

  public async createRequest(input: string | number, init?: IRequestInit): Promise<IAttachedState> {
    return await this.commandQueue.run('createRequest', input, init);
  }

  public async getUrl(): Promise<string> {
    return await this.commandQueue.run('getLocationHref');
  }

  public async goto(href: string): Promise<IResourceMeta> {
    return await this.commandQueue.run('goto', href);
  }

  public async interact(interactionGroups: IInteractionGroups): Promise<void> {
    await this.commandQueue.run('interact', ...interactionGroups);
  }

  public async exportUserProfile(): Promise<IUserProfile> {
    return await this.commandQueue.run('exportUserProfile');
  }

  public async getPageCookies(): Promise<ICookie[]> {
    return await this.commandQueue.run('getPageCookies');
  }

  public async getAllCookies(): Promise<ICookie[]> {
    return await this.commandQueue.run('getAllCookies');
  }

  public async waitForResource(
    filter: Pick<IWaitForResourceFilter, 'url' | 'type'>,
    opts: IWaitForResourceOptions,
  ): Promise<IResourceMeta[]> {
    return await this.commandQueue.run('waitForResource', filter, opts);
  }

  public async waitForElement(jsPath: IJsPath, opts: IWaitForElementOptions): Promise<void> {
    await this.commandQueue.run('waitForElement', jsPath, opts);
  }

  public async waitForLoad(status: ILocationStatus): Promise<void> {
    await this.commandQueue.run('waitForLoad', status);
  }

  public async waitForLocation(trigger: ILocationTrigger): Promise<void> {
    await this.commandQueue.run('waitForLocation', trigger);
  }

  public async waitForMillis(millis: number): Promise<void> {
    await this.commandQueue.run('waitForMillis', millis);
  }

  public async waitForWebSocket(url: string | RegExp): Promise<void> {
    await this.commandQueue.run('waitForWebSocket', url);
  }

  public async waitForNewTab(): Promise<CoreTab> {
    const sessionMeta = await this.commandQueue.run<ISessionMeta>('waitForNewTab');
    return new CoreTab(sessionMeta, this.coreClient);
  }

  public async focusTab(): Promise<void> {
    await this.commandQueue.run('focusTab');
  }

  public async closeTab(): Promise<void> {
    await this.commandQueue.run('closeTab');
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
  ): Promise<void> {
    await this.eventHeap.removeListener(jsPath, eventType, listenerFn);
  }

  public async close(): Promise<void> {
    await this.commandQueue.run('close');
    process.nextTick(() => {
      delete this.coreClient.tabsById[this.meta.tabId];
    });
  }
}
