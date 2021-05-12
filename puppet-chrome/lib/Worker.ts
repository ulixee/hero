import * as eventUtils from '@secret-agent/commons/eventUtils';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import IRegisteredEventListener from '@secret-agent/interfaces/IRegisteredEventListener';
import Protocol from 'devtools-protocol';
import { IPuppetWorker, IPuppetWorkerEvents } from '@secret-agent/interfaces/IPuppetWorker';
import { createPromise } from '@secret-agent/commons/utils';
import { IBoundLog } from '@secret-agent/interfaces/ILog';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import { BrowserContext } from './BrowserContext';
import { DevtoolsSession } from './DevtoolsSession';
import { NetworkManager } from './NetworkManager';
import ConsoleMessage from './ConsoleMessage';
import ConsoleAPICalledEvent = Protocol.Runtime.ConsoleAPICalledEvent;
import TargetInfo = Protocol.Target.TargetInfo;
import ExceptionThrownEvent = Protocol.Runtime.ExceptionThrownEvent;
import ExecutionContextCreatedEvent = Protocol.Runtime.ExecutionContextCreatedEvent;

export class Worker extends TypedEventEmitter<IPuppetWorkerEvents> implements IPuppetWorker {
  public readonly browserContext: BrowserContext;
  public isReady: Promise<Error | null>;
  public hasLoadedResponse = false;

  public readonly devtoolsSession: DevtoolsSession;

  protected readonly logger: IBoundLog;
  private readonly networkManager: NetworkManager;
  private readonly targetInfo: TargetInfo;

  private readonly registeredEvents: IRegisteredEventListener[];
  private readonly executionContextId = createPromise<number>();

  public get id(): string {
    return this.targetInfo.targetId;
  }

  public get url(): string {
    return this.targetInfo.url;
  }

  public get type(): IPuppetWorker['type'] {
    return this.targetInfo.type as IPuppetWorker['type'];
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
    this.registeredEvents = eventUtils.addEventListeners(this.devtoolsSession, [
      ['Runtime.consoleAPICalled', this.onRuntimeConsole.bind(this)],
      ['Runtime.exceptionThrown', this.onRuntimeException.bind(this)],
      ['Runtime.executionContextCreated', this.onContextCreated.bind(this)],
      ['disconnected', this.emit.bind(this, 'close')],
    ]);
    this.isReady = this.initialize(parentNetworkManager).catch(err => err);
  }

  async initialize(pageNetworkManager: NetworkManager): Promise<void> {
    const emulator = this.browserContext.emulator;
    await Promise.all([
      this.networkManager.initializeFromParent(pageNetworkManager).catch(err => {
        // web workers can use parent network
        if (err.message.includes(`'Fetch.enable' wasn't found`)) return;
        throw err;
      }),
      this.devtoolsSession.send('Runtime.enable'),
      emulator?.onNewPuppetWorker
        ? emulator.onNewPuppetWorker(this).catch(error => {
            if (error instanceof CanceledPromiseError) return;
            this.logger.error('Emulator.onNewPuppetWorkerError', {
              error,
            });
            throw error;
          })
        : null,
      this.devtoolsSession.send('Runtime.runIfWaitingForDebugger'),
    ]);
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
    eventUtils.removeEventListeners(this.registeredEvents);
  }

  toJSON() {
    return {
      id: this.id,
      url: this.url,
      type: this.type,
    };
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
