import { TypedEventEmitter } from "@secret-agent/commons/eventUtils";
import Protocol from "devtools-protocol";
import { BrowserContext } from "./BrowserContext";
import { CDPSession } from "./CDPSession";
import { NetworkManager } from "./NetworkManager";
import ConsoleMessage from "./ConsoleMessage";
import ConsoleAPICalledEvent = Protocol.Runtime.ConsoleAPICalledEvent;
import TargetInfo = Protocol.Target.TargetInfo;

interface IServiceWorkerEvents {
  close: null;
  consoleLog: { frameId: string; type: string; message: string; location: string };
}

export class Worker extends TypedEventEmitter<IServiceWorkerEvents> {
  public readonly browserContext: BrowserContext;
  private readonly cdpSession: CDPSession;
  private readonly networkManager: NetworkManager;
  private readonly targetInfo: TargetInfo;

  public get url() {
    return this.targetInfo.url;
  }

  public get workerType() {
    return this.targetInfo.type;
  }

  constructor(browserContext: BrowserContext, cdpSession: CDPSession, targetInfo: TargetInfo) {
    super();
    this.targetInfo = targetInfo;
    this.cdpSession = cdpSession;
    this.browserContext = browserContext;
    this.networkManager = new NetworkManager(cdpSession);
    cdpSession.on('Runtime.consoleAPICalled', this.onRuntimeConsole.bind(this));
  }

  async initialize(pageNetworkManager: NetworkManager) {
    await this.networkManager.initializeFromParent(pageNetworkManager);
    await Promise.all([
      this.cdpSession.send('Runtime.enable'),
      this.cdpSession.send('Runtime.runIfWaitingForDebugger'),
    ]);
  }

  private async onRuntimeConsole(event: ConsoleAPICalledEvent) {
    const message = ConsoleMessage.create(this.cdpSession, event);
    const frameId = `${this.workerType}:${this.url}`; // TBD

    this.emit('consoleLog', {
      frameId,
      ...message,
    });
  }
}
