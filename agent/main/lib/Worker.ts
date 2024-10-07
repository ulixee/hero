import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import { createPromise } from '@ulixee/commons/lib/utils';
import { IWorker, IWorkerEvents } from '@ulixee/unblocked-specification/agent/browser/IWorker';
import { IBrowserContextHooks } from '@ulixee/unblocked-specification/agent/hooks/IHooks';
import Protocol from 'devtools-protocol';
import BrowserContext from './BrowserContext';
import ConsoleMessage from './ConsoleMessage';
import DevtoolsSession from './DevtoolsSession';
import NetworkManager from './NetworkManager';
import TargetInfo = Protocol.Target.TargetInfo;

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
    this.networkManager = new NetworkManager(
      devtoolsSession,
      this.browserContext.websocketSession,
      this.logger,
      browserContext.proxy,
    );
    const session = this.devtoolsSession;
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
      this.type === 'shared_worker'
        ? this.devtoolsSession.send('Network.setCacheDisabled', { cacheDisabled: true })
        : null,
      this.initializeEmulation(hooks as IBrowserContextHooks),
    ]);

    setImmediate(() => this.initializationSent.resolve());
    return result.then(() => null);
  }

  async evaluate<T>(expression: string, isInitializationScript = false): Promise<T> {
    const result = await this.devtoolsSession.send('Runtime.evaluate', {
      expression,
      // To be able to use awaitPromise the eventloop must be running, which is not the
      // case during our initialization script since we pause debugger there.
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

  private async initializeEmulation(hooks: IBrowserContextHooks): Promise<void> {
    if (!hooks.onNewWorker) {
      await this.devtoolsSession.send('Runtime.runIfWaitingForDebugger');
      return;
    }

    try {
      const emulationPromises = [hooks.onNewWorker(this)];

      // Not needed in blob worker since we already have a plugin that handles this.
      // This is needed because cdp is often times too slow to pause debugger, it could
      // be completely to late or pause debugger mid execution somewhere, all resulting
      // in very bad results and/or crashes.
      const isBlobWorker = this.targetInfo.url.startsWith('blob:');
      if (!isBlobWorker) {
        emulationPromises.push(
          this.devtoolsSession.send('Debugger.enable'),
          this.devtoolsSession.send('Debugger.setBreakpointByUrl', {
            lineNumber: 0,
            url: this.targetInfo.url,
          }),
        );
      }

      // Service worker will lock up without this! This happens because of deadlock in chromium
      // where debugger is waiting for worker to be created but this only happens after runIfWaitingForDebugger.
      // Good news is: if we queue up everything this doesn't affect us, it's just weird...
      // https://issues.chromium.org/issues/40830027, https://issues.chromium.org/issues/40811832
      if (this.type === 'service_worker') {
        emulationPromises.push(this.devtoolsSession.send('Runtime.runIfWaitingForDebugger'));
      }

      await Promise.all(emulationPromises);
      await this.resumeAfterEmulation();
    } catch (error) {
      if (error instanceof CanceledPromiseError) return;
      await this.resumeAfterEmulation().catch(() => null);
      this.logger.warn('Emulator.onNewWorkerError', {
        error,
      });
      throw error;
    }
  }

  private resumeAfterEmulation(): Promise<any> {
    return Promise.all([
      this.devtoolsSession.send('Debugger.disable'),
      this.devtoolsSession.send('Runtime.runIfWaitingForDebugger'),
    ]);
  }
}
