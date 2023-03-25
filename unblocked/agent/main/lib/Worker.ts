import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import Protocol from 'devtools-protocol';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import { IWorker, IWorkerEvents } from '@ulixee/unblocked-specification/agent/browser/IWorker';
import { createPromise } from '@ulixee/commons/lib/utils';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { IBrowserContextHooks } from '@ulixee/unblocked-specification/agent/hooks/IHooks';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import BrowserContext from './BrowserContext';
import DevtoolsSession from './DevtoolsSession';
import NetworkManager from './NetworkManager';
import ConsoleMessage from './ConsoleMessage';
import ConsoleAPICalledEvent = Protocol.Runtime.ConsoleAPICalledEvent;
import TargetInfo = Protocol.Target.TargetInfo;
import ExceptionThrownEvent = Protocol.Runtime.ExceptionThrownEvent;
import ExecutionContextCreatedEvent = Protocol.Runtime.ExecutionContextCreatedEvent;

export class Worker extends TypedEventEmitter<IWorkerEvents> implements IWorker {
  public readonly browserContext: BrowserContext;
  public isReady: Promise<Error | null>;
  public get isInitializationSent(): Promise<void> {
    return this.initializationSent.promise;
  }

  public hasLoadedResponse = false;
  public readonly devtoolsSession: DevtoolsSession;

  protected readonly logger: IBoundLog;

  private readonly initializationSent = createPromise<void>();
  private readonly networkManager: NetworkManager;
  private readonly targetInfo: TargetInfo;

  private readonly events = new EventSubscriber();
  private readonly executionContextId = createPromise<number>();

  public get id(): string {
    return this.targetInfo.targetId;
  }

  public get url(): string {
    return this.targetInfo.url;
  }

  public get type(): IWorker['type'] {
    return this.targetInfo.type as IWorker['type'];
  }

  constructor(
    browserContext: BrowserContext,
    parentNetworkManager: NetworkManager,
    devtoolsSession: DevtoolsSession,
    logger: IBoundLog,
    targetInfo: TargetInfo,
  ) {
    super();
    this.targetInfo = targetInfo;
    this.devtoolsSession = devtoolsSession;
    this.browserContext = browserContext;
    this.logger = logger.createChild(module, {
      workerTargetId: this.id,
      workerType: this.type,
    });
    this.networkManager = new NetworkManager(devtoolsSession, this.logger, browserContext.proxy);
    const session = this.devtoolsSession;
    this.events.on(session, 'Runtime.consoleAPICalled', this.onRuntimeConsole.bind(this));
    this.events.on(session, 'Runtime.exceptionThrown', this.onRuntimeException.bind(this));
    this.events.on(session, 'Runtime.executionContextCreated', this.onContextCreated.bind(this));
    this.events.on(session, 'Inspector.targetReloadedAfterCrash', () => {
      return this.initialize(parentNetworkManager);
    });
    this.events.once(session, 'disconnected', this.emit.bind(this, 'close'));
    this.isReady = this.initialize(parentNetworkManager).catch(err => err);
  }

  initialize(pageNetworkManager: NetworkManager): Promise<void> {
    const { hooks } = this.browserContext;
    const result = Promise.all([
      this.networkManager.initializeFromParent(pageNetworkManager).catch(err => {
        // web workers can use parent network
        if (err.message.includes(`'Fetch.enable' wasn't found`)) return;
        throw err;
      }),
      this.devtoolsSession.send('Runtime.enable'),
      this.initializeEmulation(hooks as IBrowserContextHooks),
      this.devtoolsSession.send('Runtime.runIfWaitingForDebugger'),
    ]);

    setImmediate(() => this.initializationSent.resolve());
    return result.then(() => null);
  }

  async evaluate<T>(expression: string, isInitializationScript = false): Promise<T> {
    const result = await this.devtoolsSession.send('Runtime.evaluate', {
      expression,
      awaitPromise: !isInitializationScript,
      // contextId,
      returnByValue: true,
    });

    if (result.exceptionDetails) {
      throw ConsoleMessage.exceptionToError(result.exceptionDetails);
    }

    const remote = result.result;
    if (remote.objectId) this.devtoolsSession.disposeRemoteObject(remote);
    return remote.value as T;
  }

  close(): void {
    this.networkManager.close();
    this.cancelPendingEvents('Worker closing', ['close']);
    this.events.close();
  }

  toJSON(): unknown {
    return {
      id: this.id,
      url: this.url,
      type: this.type,
    };
  }

  private initializeEmulation(hooks: IBrowserContextHooks): Promise<any> {
    if (!hooks.onNewWorker) return;

    return Promise.all([
      hooks.onNewWorker(this),
      this.devtoolsSession.send('Debugger.enable'),
      this.devtoolsSession.send('Debugger.setBreakpointByUrl', {
        lineNumber: 0,
        url: this.targetInfo.url,
      }),
    ])
      .then(this.resumeAfterEmulation.bind(this))
      .catch(async error => {
        if (error instanceof CanceledPromiseError) return;
        await this.resumeAfterEmulation().catch(() => null);
        this.logger.warn('Emulator.onNewWorkerError', {
          error,
        });
        throw error;
      });
  }

  private resumeAfterEmulation(): Promise<any> {
    return Promise.all([
      this.devtoolsSession.send('Runtime.runIfWaitingForDebugger'),
      this.devtoolsSession.send('Debugger.disable'),
    ]);
  }

  private onContextCreated(event: ExecutionContextCreatedEvent): void {
    this.executionContextId.resolve(event.context.id);
  }

  private onRuntimeException(msg: ExceptionThrownEvent): void {
    const error = ConsoleMessage.exceptionToError(msg.exceptionDetails);

    this.emit('page-error', {
      error,
    });
  }

  private onRuntimeConsole(event: ConsoleAPICalledEvent): void {
    const message = ConsoleMessage.create(this.devtoolsSession, event);
    const frameId = `${this.type}:${this.url}`; // TBD

    this.emit('console', {
      frameId,
      ...message,
    });
  }
}
