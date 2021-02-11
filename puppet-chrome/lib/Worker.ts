import * as eventUtils from '@secret-agent/commons/eventUtils';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import IRegisteredEventListener from '@secret-agent/core-interfaces/IRegisteredEventListener';
import Protocol from 'devtools-protocol';
import { IPuppetWorker, IPuppetWorkerEvents } from '@secret-agent/puppet-interfaces/IPuppetWorker';
import { createPromise } from '@secret-agent/commons/utils';
import { IBoundLog } from '@secret-agent/core-interfaces/ILog';
import { BrowserContext } from './BrowserContext';
import { CDPSession } from './CDPSession';
import { NetworkManager } from './NetworkManager';
import ConsoleMessage from './ConsoleMessage';
import ConsoleAPICalledEvent = Protocol.Runtime.ConsoleAPICalledEvent;
import TargetInfo = Protocol.Target.TargetInfo;
import ExceptionThrownEvent = Protocol.Runtime.ExceptionThrownEvent;
import ExecutionContextCreatedEvent = Protocol.Runtime.ExecutionContextCreatedEvent;

export class Worker extends TypedEventEmitter<IPuppetWorkerEvents> implements IPuppetWorker {
  public readonly browserContext: BrowserContext;
  public isReady: Promise<Error | null>;

  protected readonly logger: IBoundLog;

  private readonly cdpSession: CDPSession;
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
    cdpSession: CDPSession,
    workerInitializeFn: (worker: IPuppetWorker) => Promise<void>,
    logger: IBoundLog,
    targetInfo: TargetInfo,
  ) {
    super();
    this.targetInfo = targetInfo;
    this.cdpSession = cdpSession;
    this.browserContext = browserContext;
    this.logger = logger.createChild(module, {
      workerTargetId: this.id,
      workerType: this.type,
    });
    this.networkManager = new NetworkManager(cdpSession, this.logger);
    this.registeredEvents = eventUtils.addEventListeners(this.cdpSession, [
      ['Runtime.consoleAPICalled', this.onRuntimeConsole.bind(this)],
      ['Runtime.exceptionThrown', this.onRuntimeException.bind(this)],
      ['Runtime.executionContextCreated', this.onContextCreated.bind(this)],
      ['disconnected', this.emit.bind(this, 'close')],
    ]);
    this.isReady = this.initialize(parentNetworkManager, workerInitializeFn).catch(err => err);
  }

  async initialize(
    pageNetworkManager: NetworkManager,
    initializeFn: (worker: IPuppetWorker) => Promise<void>,
  ): Promise<void> {
    await this.networkManager.initializeFromParent(pageNetworkManager).catch(err => {
      // web workers can use parent network
      if (err.message.includes(`'Fetch.enable' wasn't found`)) return;
      throw err;
    });

    await this.cdpSession.send('Runtime.enable');
    if (initializeFn) await initializeFn(this);

    await this.cdpSession.send('Runtime.runIfWaitingForDebugger');
  }

  async evaluate<T>(expression: string, isInitializationScript = false): Promise<T> {
    if (!isInitializationScript) {
      const didThrowError = await this.isReady;
      if (didThrowError) throw didThrowError;
    }
    const contextId = await this.executionContextId.promise;
    const result = await this.cdpSession.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      contextId,
      returnByValue: true,
    });

    if (result.exceptionDetails) {
      throw ConsoleMessage.exceptionToError(result.exceptionDetails);
    }

    const remote = result.result;
    if (remote.objectId) this.cdpSession.disposeRemoteObject(remote);
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
    const message = ConsoleMessage.create(this.cdpSession, event);
    const frameId = `${this.type}:${this.url}`; // TBD

    this.emit('console', {
      frameId,
      ...message,
    });
  }
}
