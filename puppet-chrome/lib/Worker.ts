import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import Protocol from 'devtools-protocol';
import { BrowserContext } from './BrowserContext';
import { CDPSession } from '../process/CDPSession';
import { NetworkManager } from './NetworkManager';
import { printStackTrace, valueFromRemoteObject } from './Utils';
import ConsoleAPICalledEvent = Protocol.Runtime.ConsoleAPICalledEvent;

interface IServiceWorkerEvents {
  close: null;
  consoleLog: { frameId: string; type: string; message: string; location: string };
}

export class Worker extends TypedEventEmitter<IServiceWorkerEvents> {
  public readonly browserContext: BrowserContext;
  private cdpSession: CDPSession;
  private networkManager: NetworkManager;
  private readonly url: string;
  private readonly workerType: string; // service_worker, shared_worker

  constructor(browserContext: BrowserContext, cdpSession: CDPSession, url: string, type: string) {
    super();
    this.url = url;
    this.cdpSession = cdpSession;
    this.browserContext = browserContext;
    this.networkManager = new NetworkManager(cdpSession);
    this.workerType = type;
    cdpSession.on('Runtime.consoleAPICalled', this.onRuntimeConsole.bind(this));
  }

  async initialize(pageNetworkManager: NetworkManager) {
    await this.networkManager.initialize(pageNetworkManager);
    await Promise.all([
      this.cdpSession.send('Runtime.enable'),
      this.cdpSession.send('Runtime.runIfWaitingForDebugger'),
    ]);
  }

  private async onRuntimeConsole(event: ConsoleAPICalledEvent) {
    const { args, stackTrace, type, context } = event;
    const frameId = `${this.workerType}:${this.url}`; // TBD

    const message = args
      .map(arg => {
        this.cdpSession.disposeObject(arg);

        return valueFromRemoteObject(arg);
      })
      .join(' ');

    const location = `//#${context ?? 'nocontext'}${printStackTrace(stackTrace)}`;

    this.emit('consoleLog', {
      frameId,
      type,
      message,
      location,
    });
  }
}
