import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import IWaitForResourceOptions from '@ulixee/hero-interfaces/IWaitForResourceOptions';
import IResourceMeta from '@bureau/interfaces/IResourceMeta';
import IUserProfile from '@ulixee/hero-interfaces/IUserProfile';
import IConfigureSessionOptions from '@ulixee/hero-interfaces/IConfigureSessionOptions';
import IWaitForOptions from '@ulixee/hero-interfaces/IWaitForOptions';
import IScreenshotOptions from '@bureau/interfaces/IScreenshotOptions';
import IFrameMeta from '@ulixee/hero-interfaces/IFrameMeta';
import TimeoutError from '@ulixee/commons/interfaces/TimeoutError';
import IFileChooserPrompt from '@bureau/interfaces/IFileChooserPrompt';
import CoreCommandQueue from './CoreCommandQueue';
import CoreEventHeap from './CoreEventHeap';
import IWaitForResourceFilter from '../interfaces/IWaitForResourceFilter';
import { createResource } from './Resource';
import IJsPathEventTarget from '../interfaces/IJsPathEventTarget';
import ConnectionToCore from '../connections/ConnectionToCore';
import CoreFrameEnvironment from './CoreFrameEnvironment';
import { createDialog } from './Dialog';
import CoreSession from './CoreSession';
import ICommandCounter from '../interfaces/ICommandCounter';
import IFlowHandler from '../interfaces/IFlowHandler';
import DomStateHandler from './DomStateHandler';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import DomState from './DomState';
import ISourceCodeLocation from '@ulixee/commons/interfaces/ISourceCodeLocation';
import IDomState, { IDomStateAllFn } from '@ulixee/hero-interfaces/IDomState';
import IResourceFilterProperties from '@ulixee/hero-interfaces/IResourceFilterProperties';
import { scriptInstance } from './internal';
import FlowCommands from './FlowCommands';
import ICoreRequestPayload from '@ulixee/hero-interfaces/ICoreRequestPayload';
import IFlowCommandOptions from '@ulixee/hero-interfaces/IFlowCommandOptions';

export default class CoreTab implements IJsPathEventTarget {
  private static waitForStateCommandPlaceholder = 'waitForState';

  public tabId: number;
  public sessionId: string;
  public commandQueue: CoreCommandQueue;
  public eventHeap: CoreEventHeap;
  public readonly coreSession: CoreSession;
  public get mainFrameEnvironment(): CoreFrameEnvironment {
    return this.frameEnvironmentsById.get(this.mainFrameId);
  }

  public frameEnvironmentsById = new Map<number, CoreFrameEnvironment>();
  protected readonly meta: ISessionMeta & { sessionName: string };
  private readonly flowCommands = new FlowCommands(this);
  private readonly flowHandlers: IFlowHandler[] = [];
  private readonly connection: ConnectionToCore;
  private readonly mainFrameId: number;

  constructor(
    meta: ISessionMeta & { sessionName: string },
    connection: ConnectionToCore,
    coreSession: CoreSession,
  ) {
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
    this.commandQueue = new CoreCommandQueue(
      this.meta,
      coreSession.mode,
      connection,
      coreSession as ICommandCounter,
    );
    this.commandQueue.registerCommandRetryHandlerFn(this.shouldRetryFlowHandlers.bind(this));
    this.coreSession = coreSession;
    this.eventHeap = new CoreEventHeap(this.meta, connection, coreSession as ICommandCounter);
    this.frameEnvironmentsById.set(frameId, new CoreFrameEnvironment(this, meta, null));

    const resolvedThis = Promise.resolve(this);
    this.eventHeap.registerEventInterceptors({
      resource: createResource.bind(null, resolvedThis),
      dialog: createDialog.bind(null, resolvedThis),
    });
  }

  public async waitForState(
    state: IDomState | DomState | IDomStateAllFn,
    options: Pick<IWaitForOptions, 'timeoutMs'> = { timeoutMs: 30e3 },
  ): Promise<void> {
    const callsitePath = scriptInstance.getScriptCallsite();
    if (typeof state === 'function') {
      state = { all: state };
    }
    const handler = new DomStateHandler(state, null, this, callsitePath, {
      flowCommand: this.flowCommands.runningFlowCommand,
    });
    try {
      await handler.waitFor(options.timeoutMs);
    } catch (error) {
      if (!(error instanceof TimeoutError)) throw error;

      // Retry state after each flow handler, but do not retry the timeout
      for (let i = 0; i < CoreCommandQueue.maxCommandRetries; i += 1) {
        this.commandQueue.retryingCommand = {
          command: CoreTab.waitForStateCommandPlaceholder,
          retryNumber: i,
        } as any;

        const keepGoing = await this.triggerFlowHandlers();
        if (!keepGoing) break;

        if (this.flowCommands.isRunning) throw error;

        const didPass = await handler.check(true);
        if (didPass) return;
      }

      throw error;
    }
  }

  public async validateState(
    state: IDomState | DomState | IDomStateAllFn,
    callsitePath: ISourceCodeLocation[],
  ): Promise<boolean> {
    if (typeof state === 'function') {
      state = { all: state };
    }
    const handler = new DomStateHandler(state, null, this, callsitePath);
    return await handler.check();
  }

  public async registerFlowHandler(
    name: string,
    state: IDomState | DomState | IDomStateAllFn,
    handlerFn: (error?: Error) => Promise<any>,
    callsitePath: ISourceCodeLocation[],
  ): Promise<void> {
    const id = this.flowHandlers.length + 1;
    if (typeof state === 'function') {
      state = { all: state };
    }
    this.flowHandlers.push({ id, name, state, callsitePath, handlerFn });
    await this.commandQueue.runOutOfBand('Tab.registerFlowHandler', name, id, callsitePath);
  }

  public async runFlowCommand<T>(
    commandFn: () => Promise<T>,
    exitState: IDomState | DomState | IDomStateAllFn,
    callsitePath: ISourceCodeLocation[],
    options?: IFlowCommandOptions,
  ): Promise<T> {
    if (typeof exitState === 'function') {
      exitState = { all: exitState };
    }
    const flowCommand = await this.flowCommands.create(commandFn, exitState, callsitePath, options);

    return await flowCommand.run();
  }

  public async shouldRetryFlowHandlers(
    command: CoreCommandQueue['internalState']['lastCommand'],
    error: Error,
  ): Promise<boolean> {
    if (error instanceof CanceledPromiseError) return false;
    if (
      // NOTE: waitForState is also handled in it's own fn
      command?.command === 'FrameEnvironment.execJsPath' ||
      command?.command === 'FrameEnvironment.interact' ||
      command?.command === CoreTab.waitForStateCommandPlaceholder
    ) {
      return await this.triggerFlowHandlers();
    }
    return false;
  }

  public async triggerFlowHandlers(): Promise<boolean> {
    const matchingStates: IFlowHandler[] = [];
    await Promise.all(
      this.flowHandlers.map(async flowHandler => {
        const handler = new DomStateHandler(
          flowHandler.state,
          null,
          this,
          flowHandler.callsitePath,
          { flowHandlerId: flowHandler.id },
        );
        try {
          if (await handler.check()) {
            matchingStates.push(flowHandler);
          }
        } catch (err) {
          await flowHandler.handlerFn(err);
        }
      }),
    );
    if (!matchingStates.length) return false;

    try {
      const flowHandler = matchingStates[0];
      this.flowCommands.didRunFlowHandlers();
      this.commandQueue.setCommandMetadata({ activeFlowHandlerId: flowHandler.id });
      await flowHandler.handlerFn();
      return true;
    } finally {
      this.commandQueue.setCommandMetadata({ activeFlowHandlerId: undefined });
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
        new CoreFrameEnvironment(this, meta, frameMeta.parentFrameId),
      );
    }
    return this.frameEnvironmentsById.get(frameMeta.id);
  }

  public async getResourceProperty<T = any>(id: number, propertyPath: string): Promise<T> {
    return await this.commandQueue.runOutOfBand('Tab.getResourceProperty', id, propertyPath);
  }

  public async configure(options: IConfigureSessionOptions): Promise<void> {
    await this.commandQueue.run('Tab.configure', options);
  }

  public async collectResource(name: string, resourceId: number): Promise<void> {
    return await this.commandQueue.run('Tab.collectResource', name, resourceId, Date.now());
  }

  public async goto(href: string, options: { timeoutMs?: number }): Promise<IResourceMeta> {
    return await this.commandQueue.run('Tab.goto', href, options);
  }

  public async goBack(options: { timeoutMs?: number }): Promise<string> {
    return await this.commandQueue.run('Tab.goBack', options);
  }

  public async goForward(options: { timeoutMs?: number }): Promise<string> {
    return await this.commandQueue.run('Tab.goForward', options);
  }

  public async findResource(
    filter: IResourceFilterProperties,
    options?: { sinceCommandId?: number },
  ): Promise<IResourceMeta> {
    return await this.commandQueue.run('Tab.findResource', filter, options);
  }

  public async findResources(
    filter: IResourceFilterProperties,
    options?: { sinceCommandId?: number },
  ): Promise<IResourceMeta[]> {
    return await this.commandQueue.run('Tab.findResources', filter, options);
  }

  public async reload(options: { timeoutMs?: number }): Promise<IResourceMeta> {
    return await this.commandQueue.run('Tab.reload', options);
  }

  public async exportUserProfile(): Promise<IUserProfile> {
    return await this.commandQueue.run('Session.exportUserProfile');
  }

  public async takeScreenshot(options: IScreenshotOptions): Promise<Buffer> {
    return await this.commandQueue.run('Tab.takeScreenshot', options);
  }

  public async waitForFileChooser(options: IWaitForOptions): Promise<IFileChooserPrompt> {
    return await this.commandQueue.run('Tab.waitForFileChooser', options);
  }

  public async waitForResources(
    filter: Pick<IWaitForResourceFilter, 'url' | 'type'>,
    opts: IWaitForResourceOptions,
  ): Promise<IResourceMeta[]> {
    return await this.commandQueue.run('Tab.waitForResources', filter, opts);
  }

  public async waitForMillis(millis: number): Promise<void> {
    await this.commandQueue.run('Tab.waitForMillis', millis);
  }

  public async waitForNewTab(opts: IWaitForOptions): Promise<CoreTab> {
    const sessionMeta = await this.commandQueue.run<ISessionMeta>('Tab.waitForNewTab', opts);
    const session = this.connection.getSession(sessionMeta.sessionId);
    return session.addTab(sessionMeta);
  }

  public async focusTab(): Promise<void> {
    await this.commandQueue.run('Tab.focus');
  }

  public async dismissDialog(accept: boolean, promptText?: string): Promise<void> {
    await this.commandQueue.runOutOfBand('Tab.dismissDialog', accept, promptText);
  }

  public async addEventListener(
    jsPath: IJsPath | null,
    eventType: string,
    listenerFn: (...args: any[]) => void,
    options?: any,
    extras?: Partial<ICoreRequestPayload>,
  ): Promise<void> {
    if (this.commandQueue.commandMetadata) {
      extras ??= {};
      Object.assign(extras, this.commandQueue.commandMetadata);
    }
    await this.eventHeap.addListener(jsPath, eventType, listenerFn, options, extras);
  }

  public async removeEventListener(
    jsPath: IJsPath | null,
    eventType: string,
    listenerFn: (...args: any[]) => void,
    options?: any,
    extras?: Partial<ICoreRequestPayload>,
  ): Promise<void> {
    if (this.commandQueue.commandMetadata) {
      extras ??= {};
      Object.assign(extras, this.commandQueue.commandMetadata);
    }

    await this.eventHeap.removeListener(jsPath, eventType, listenerFn, options, extras);
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
