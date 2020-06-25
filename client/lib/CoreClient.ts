import ICreateSessionOptions from '@secret-agent/core-interfaces/ICreateSessionOptions';
import IConfigureOptions from '@secret-agent/core-interfaces/IConfigureOptions';
import ISessionMeta from '@secret-agent/core-interfaces/ISessionMeta';
import CoreCommandQueue from './CoreCommandQueue';
import CoreClientSession from './CoreClientSession';

export default class CoreClient {
  public readonly commandQueue: CoreCommandQueue;
  public readonly sessionsByWindowId: { [windowId: string]: CoreClientSession } = {};
  public pipeOutgoingCommand: (
    meta: ISessionMeta | null,
    command: string,
    args: any[],
  ) => Promise<{ commandId?: number; data: any }>;

  constructor() {
    this.commandQueue = new CoreCommandQueue(null, this);
  }

  public async configure(options: IConfigureOptions): Promise<void> {
    await this.commandQueue.run<void>('configure', options);
  }

  public async createSession(options: ICreateSessionOptions): Promise<CoreClientSession> {
    const sessionMeta = await this.commandQueue.run<ISessionMeta>('createSession', options);
    const coreClientSession = new CoreClientSession(sessionMeta, this);
    this.sessionsByWindowId[sessionMeta.windowId] = coreClientSession;
    return coreClientSession;
  }

  public async shutdown(): Promise<void> {
    await this.commandQueue.run<void>('shutdown');
    Object.keys(this.sessionsByWindowId).forEach(
      windowId => delete this.sessionsByWindowId[windowId],
    );
  }

  public async start(options?: IConfigureOptions): Promise<void> {
    await this.commandQueue.run<void>('start', options);
  }

  public pipeIncomingEvent(meta: ISessionMeta, listenerId: string, eventData: any): void {
    this.sessionsByWindowId[meta.windowId].eventHeap.incomingEvent(meta, listenerId, eventData);
  }
}
