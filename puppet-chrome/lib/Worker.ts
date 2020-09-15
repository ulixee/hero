import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import Protocol from 'devtools-protocol';
import { IPuppetWorker, IPuppetWorkerEvents } from '@secret-agent/puppet/interfaces/IPuppetWorker';
import { BrowserContext } from './BrowserContext';
import { CDPSession } from './CDPSession';
import { NetworkManager } from './NetworkManager';
import ConsoleMessage from './ConsoleMessage';
import ConsoleAPICalledEvent = Protocol.Runtime.ConsoleAPICalledEvent;
import TargetInfo = Protocol.Target.TargetInfo;
import ExceptionThrownEvent = Protocol.Runtime.ExceptionThrownEvent;

export class Worker extends TypedEventEmitter<IPuppetWorkerEvents> implements IPuppetWorker {
  public readonly browserContext: BrowserContext;
  private readonly cdpSession: CDPSession;
  private readonly networkManager: NetworkManager;
  private readonly targetInfo: TargetInfo;
  private readonly executionContextId: Promise<number>;

  public get id() {
    return this.targetInfo.targetId;
  }

  public get url() {
    return this.targetInfo.url;
  }

  public get type() {
    return this.targetInfo.type;
  }

  constructor(browserContext: BrowserContext, cdpSession: CDPSession, targetInfo: TargetInfo) {
    super();
    this.targetInfo = targetInfo;
    this.cdpSession = cdpSession;
    this.browserContext = browserContext;
    this.networkManager = new NetworkManager(cdpSession);
    cdpSession.on('Runtime.consoleAPICalled', this.onRuntimeConsole.bind(this));
    cdpSession.on('Runtime.exceptionThrown', this.onRuntimeException.bind(this));
    cdpSession.once('disconnected', this.emit.bind(this, 'close'));
    this.executionContextId = new Promise<number>(resolve => {
      this.cdpSession.once('Runtime.executionContextCreated', event => {
        resolve(event.context.id);
      });
    });
  }

  async initialize(pageNetworkManager: NetworkManager) {
    await this.networkManager.initializeFromParent(pageNetworkManager).catch(err => {
      // web workers can use parent network
      if (err.message.includes(`'Fetch.enable' wasn't found`)) return;
      throw err;
    });
    await Promise.all([
      this.cdpSession.send('Runtime.enable'),
      this.cdpSession.send('Runtime.runIfWaitingForDebugger'),
    ]);
  }

  async evaluate<T>(expression: string): Promise<T> {
    const result = await this.cdpSession.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      contextId: await this.executionContextId,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      throw ConsoleMessage.exceptionToError(result.exceptionDetails);
    }

    const remote = result.result;
    if (remote.objectId) this.cdpSession.disposeRemoteObject(remote);
    return remote.value as T;
  }

  toJSON() {
    return {
      id: this.id,
      url: this.url,
      type: this.type,
    };
  }

  private onRuntimeException(msg: ExceptionThrownEvent) {
    const error = ConsoleMessage.exceptionToError(msg.exceptionDetails);

    this.emit('pageError', {
      error,
    });
  }

  private async onRuntimeConsole(event: ConsoleAPICalledEvent) {
    const message = ConsoleMessage.create(this.cdpSession, event);
    const frameId = `${this.type}:${this.url}`; // TBD

    this.emit('consoleLog', {
      frameId,
      ...message,
    });
  }
}
