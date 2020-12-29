import ICreateSessionOptions from '@secret-agent/core-interfaces/ICreateSessionOptions';
import ISessionMeta from '@secret-agent/core-interfaces/ISessionMeta';
import ICoreResponsePayload from '@secret-agent/core-interfaces/ICoreResponsePayload';
import ICoreEventPayload from '@secret-agent/core-interfaces/ICoreEventPayload';
import Queue from '@secret-agent/commons/Queue';
import CoreCommandQueue from './CoreCommandQueue';
import CoreSession from './CoreSession';
import CoreClientConnection from './CoreClientConnection';
import Agent from './Agent';
import { IAgentCreateOptions } from '../index';
import ICoreConnectionOptions from '../interfaces/ICoreConnectionOptions';
import RemoteCoreConnection from './RemoteCoreConnection';

export default class CoreClient {
  public static LocalCoreConnectionCreator?: (
    options: ICoreConnectionOptions,
  ) => CoreClientConnection;

  public readonly commandQueue: CoreCommandQueue;

  public readonly sessionsById = new Map<string, CoreSession>();
  private readonly concurrentSessionsQueue = new Queue('AGENT QUEUE');
  private readonly connection: CoreClientConnection;
  private readonly agentTimeoutMillis: number | undefined;

  constructor(connection: CoreClientConnection) {
    this.commandQueue = new CoreCommandQueue(null, this);
    this.connection = connection;

    const options = connection.options ?? {};
    this.agentTimeoutMillis = options.agentTimeoutMillis;
    this.concurrentSessionsQueue.concurrency = options?.maxConcurrency ?? 1;

    connection.on('event', this.onEvent.bind(this));
    connection.on('connect', this.onConnected.bind(this));
  }

  public hasRemoteConnection(): boolean {
    return this.connection instanceof RemoteCoreConnection;
  }

  public async useAgent(
    options: IAgentCreateOptions,
    callbackFn: (agent: Agent) => Promise<any>,
  ): Promise<void> {
    await this.connection.connect();
    await this.concurrentSessionsQueue.run(async () => {
      const agent = new Agent(() => this, options);
      await callbackFn(agent);
    }, this.agentTimeoutMillis);
  }

  public async pipeOutgoingCommand(
    meta: ISessionMeta | null,
    command: string,
    args: any[],
  ): Promise<ICoreResponsePayload> {
    const connection = await this.connection;
    return connection.send({
      meta,
      command,
      args,
    });
  }

  public async createSession(options: ICreateSessionOptions): Promise<CoreSession> {
    const sessionMeta = await this.commandQueue.run<ISessionMeta>('createSession', options);
    const coreSession = new CoreSession(sessionMeta, this);
    const { sessionId } = sessionMeta;

    this.sessionsById.set(sessionId, coreSession);
    return coreSession;
  }

  public async waitForIdle(): Promise<void> {
    await this.concurrentSessionsQueue.idlePromise.promise;
  }

  public async disconnect(fatalError?: Error): Promise<void> {
    this.commandQueue.clearPending();
    this.concurrentSessionsQueue.stop();
    if (this.sessionsById.size > 0 || fatalError) {
      await this.commandQueue.run('disconnect', [fatalError]);
    }
    this.sessionsById.clear();
  }

  public async logUnhandledError(error: Error): Promise<void> {
    await this.commandQueue.run('logUnhandledError', error);
  }

  protected onEvent(payload: ICoreEventPayload): void {
    const { meta, listenerId, eventArgs } = payload as ICoreEventPayload;
    const session = this.sessionsById.get(meta.sessionId);
    session.onEvent(meta, listenerId, eventArgs);
  }

  protected onConnected(): void {
    const maxCoreConcurrency = this.connection.options.maxConcurrency;
    if (maxCoreConcurrency) {
      this.concurrentSessionsQueue.concurrency = maxCoreConcurrency;
    }
  }
}
