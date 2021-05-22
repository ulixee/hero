import ISessionMeta from '@secret-agent/interfaces/ISessionMeta';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import IWaitForResourceOptions from '@secret-agent/interfaces/IWaitForResourceOptions';
import IResourceMeta from '@secret-agent/interfaces/IResourceMeta';
import IUserProfile from '@secret-agent/interfaces/IUserProfile';
import IConfigureSessionOptions from '@secret-agent/interfaces/IConfigureSessionOptions';
import IWaitForOptions from '@secret-agent/interfaces/IWaitForOptions';
import IScreenshotOptions from '@secret-agent/interfaces/IScreenshotOptions';
import IFrameMeta from '@secret-agent/interfaces/IFrameMeta';
import CoreCommandQueue from './CoreCommandQueue';
import CoreEventHeap from './CoreEventHeap';
import IWaitForResourceFilter from '../interfaces/IWaitForResourceFilter';
import { createResource } from './Resource';
import IJsPathEventTarget from '../interfaces/IJsPathEventTarget';
import ConnectionToCore from '../connections/ConnectionToCore';
import CoreFrameEnvironment from './CoreFrameEnvironment';

export default class CoreTab implements IJsPathEventTarget {
  public tabId: number;
  public sessionId: string;
  public commandQueue: CoreCommandQueue;
  public eventHeap: CoreEventHeap;
  public get mainFrameEnvironment(): CoreFrameEnvironment {
    return this.frameEnvironmentsById.get(this.mainFrameId);
  }

  protected frameEnvironmentsById = new Map<string, CoreFrameEnvironment>();
  protected readonly meta: ISessionMeta & { sessionName: string };
  private readonly connection: ConnectionToCore;
  private readonly mainFrameId: string;

  constructor(meta: ISessionMeta & { sessionName: string }, connection: ConnectionToCore) {
    const { tabId, sessionId, frameId, sessionName } = meta;
    this.tabId = tabId;
    this.sessionId = sessionId;
    this.mainFrameId = frameId;
    this.meta = {
      sessionId,
      tabId,
      sessionName,
    };
    this.connection = connection;
    this.commandQueue = new CoreCommandQueue(meta, connection);
    this.eventHeap = new CoreEventHeap(this.meta, connection);
    this.frameEnvironmentsById.set(frameId, new CoreFrameEnvironment(meta, this.commandQueue));

    if (!this.eventHeap.hasEventInterceptors('resource')) {
      this.eventHeap.registerEventInterceptor('resource', (resource: IResourceMeta) => {
        return [createResource(resource, Promise.resolve(this))];
      });
    }
  }

  public async getCoreFrameEnvironments(): Promise<CoreFrameEnvironment[]> {
    const frameMetas = await this.commandQueue.run<IFrameMeta[]>('Tab.getFrameEnvironments');
    for (const frameMeta of frameMetas) {
      this.getCoreFrameForMeta(frameMeta);
    }
    return [...this.frameEnvironmentsById.values()];
  }

  public getCoreFrameForMeta(frameMeta: IFrameMeta): CoreFrameEnvironment {
    if (!this.frameEnvironmentsById.has(frameMeta.id)) {
      const meta = { ...this.meta };
      meta.frameId = frameMeta.id;
      this.frameEnvironmentsById.set(
        frameMeta.id,
        new CoreFrameEnvironment(meta, this.commandQueue),
      );
    }
    return this.frameEnvironmentsById.get(frameMeta.id);
  }

  public async getResourceProperty<T = any>(id: number, propertyPath: string): Promise<T> {
    return await this.commandQueue.run('Tab.getResourceProperty', id, propertyPath);
  }

  public async configure(options: IConfigureSessionOptions): Promise<void> {
    await this.commandQueue.run('Tab.configure', options);
  }

  public async goto(href: string, timeoutMs?: number): Promise<IResourceMeta> {
    return await this.commandQueue.run('Tab.goto', href, timeoutMs);
  }

  public async goBack(timeoutMs?: number): Promise<string> {
    return await this.commandQueue.run('Tab.goBack', timeoutMs);
  }

  public async goForward(timeoutMs?: number): Promise<string> {
    return await this.commandQueue.run('Tab.goForward', timeoutMs);
  }

  public async reload(timeoutMs?: number): Promise<void> {
    return await this.commandQueue.run('Tab.reload', timeoutMs);
  }

  public async exportUserProfile(): Promise<IUserProfile> {
    return await this.commandQueue.run('Session.exportUserProfile');
  }

  public async takeScreenshot(options: IScreenshotOptions): Promise<Buffer> {
    return await this.commandQueue.run('Tab.takeScreenshot', options);
  }

  public async waitForResource(
    filter: Pick<IWaitForResourceFilter, 'url' | 'type'>,
    opts: IWaitForResourceOptions,
  ): Promise<IResourceMeta[]> {
    return await this.commandQueue.run('Tab.waitForResource', filter, opts);
  }

  public async waitForMillis(millis: number): Promise<void> {
    await this.commandQueue.run('Tab.waitForMillis', millis);
  }

  public async waitForNewTab(opts: IWaitForOptions): Promise<CoreTab> {
    const sessionMeta = await this.commandQueue.run<ISessionMeta>('Session.waitForNewTab', opts);
    const session = this.connection.getSession(sessionMeta.sessionId);
    session.addTab(sessionMeta);
    return new CoreTab({ ...this.meta, tabId: sessionMeta.tabId }, this.connection);
  }

  public async focusTab(): Promise<void> {
    await this.commandQueue.run('Tab.focus');
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

  public async flush(): Promise<void> {
    for (const frame of this.frameEnvironmentsById.values()) {
      await frame.commandQueue.flush();
    }
    await this.commandQueue.flush();
  }

  public async close(): Promise<void> {
    await this.flush();
    await this.commandQueue.run('Tab.close');
    const session = this.connection.getSession(this.sessionId);
    session?.removeTab(this);
  }
}
