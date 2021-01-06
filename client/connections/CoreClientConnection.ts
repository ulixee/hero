import ICoreRequestPayload from '@secret-agent/core-interfaces/ICoreRequestPayload';
import ICoreEventPayload from '@secret-agent/core-interfaces/ICoreEventPayload';
import ICoreResponsePayload from '@secret-agent/core-interfaces/ICoreResponsePayload';
import { createPromise } from '@secret-agent/commons/utils';
import IResolvablePromise from '@secret-agent/core-interfaces/IResolvablePromise';
import Log from '@secret-agent/commons/Logger';
import ICreateSessionOptions from '@secret-agent/core-interfaces/ICreateSessionOptions';
import ISessionMeta from '@secret-agent/core-interfaces/ISessionMeta';
import ICoreConnectionOptions from '../interfaces/ICoreConnectionOptions';
import CoreCommandQueue from '../lib/CoreCommandQueue';
import CoreSession from '../lib/CoreSession';
import { IAgentCreateOptions } from '../index';
import Agent from '../lib/Agent';
import CoreSessions from '../lib/CoreSessions';

const { log } = Log(module);

export default abstract class CoreClientConnection {
  public readonly commandQueue: CoreCommandQueue;
  public options: ICoreConnectionOptions;

  protected connectPromise: Promise<Error | null>;

  private coreSessions: CoreSessions;
  private readonly pendingRequestsById = new Map<string, IResolvablePromiseWithId>();
  private lastId = 0;

  constructor(options?: ICoreConnectionOptions) {
    this.options = options ?? { isPersistent: true };
    this.commandQueue = new CoreCommandQueue(null, this);
    this.coreSessions = new CoreSessions(
      this.options.maxConcurrency,
      this.options.agentTimeoutMillis,
    );
  }

  protected abstract internalSendRequest(payload: ICoreRequestPayload): void | Promise<void>;

  public connect(): Promise<Error | null> {
    if (this.connectPromise) return this.connectPromise;

    const { promise, id } = this.createPendingResult();
    this.connectPromise = promise.then(x => this.onConnected(x.data)).catch(err => err);
    this.internalSendRequest({
      command: 'connect',
      args: [this.options],
      messageId: id,
    });

    return this.connectPromise;
  }

  public async disconnect(fatalError?: Error): Promise<void> {
    this.commandQueue.clearPending();
    this.coreSessions.close();
    if (this.connectPromise || fatalError) {
      await this.commandQueue.run('disconnect', [fatalError]);
      this.connectPromise = null;
    }
  }

  ///////  PIPE FUNCTIONS  /////////////////////////////////////////////////////////////////////////////////////////////

  public async sendRequest(
    payload: Omit<ICoreRequestPayload, 'messageId'>,
  ): Promise<ICoreResponsePayload> {
    await this.connect();
    const { promise, id } = this.createPendingResult();
    await this.internalSendRequest({
      messageId: id,
      ...payload,
    });
    return promise;
  }

  public onMessage(payload: ICoreResponsePayload | ICoreEventPayload): void {
    if ((payload as ICoreResponsePayload).responseId) {
      payload = payload as ICoreResponsePayload;
      this.onResponse(payload.responseId, payload);
    } else if ((payload as ICoreEventPayload).listenerId) {
      this.onEvent(payload as ICoreEventPayload);
    } else {
      throw new Error(`message could not be processed: ${payload}`);
    }
  }
  ///////  SESSION FUNCTIONS  //////////////////////////////////////////////////////////////////////////////////////////

  public async useAgent(
    options: IAgentCreateOptions,
    callbackFn: (agent: Agent) => Promise<any>,
  ): Promise<void> {
    await this.connect();
    await this.coreSessions.waitForAvailable(() => {
      const agent = new Agent({
        ...options,
        coreConnection: this,
      });
      return callbackFn(agent);
    });
  }

  public async createSession(options: ICreateSessionOptions): Promise<CoreSession> {
    const sessionMeta = await this.commandQueue.run<ISessionMeta>('createSession', options);
    const session = new CoreSession({ ...sessionMeta, sessionName: options.sessionName }, this);
    this.coreSessions.track(session);
    return session;
  }

  public getSession(sessionId: string): CoreSession {
    return this.coreSessions.get(sessionId);
  }

  public closeSession(coreSession: CoreSession): void {
    this.coreSessions.untrack(coreSession.sessionId);
  }

  public async logUnhandledError(error: Error): Promise<void> {
    await this.commandQueue.run('logUnhandledError', error);
  }

  public isRemoteConnection(): boolean {
    return false;
  }

  protected onEvent(payload: ICoreEventPayload): void {
    const { meta, listenerId, eventArgs } = payload as ICoreEventPayload;
    const session = this.getSession(meta.sessionId);
    session?.onEvent(meta, listenerId, eventArgs);
  }

  protected onResponse(id: string, message: ICoreResponsePayload): void {
    const pending = this.pendingRequestsById.get(id);
    if (!pending) return;
    this.pendingRequestsById.delete(id);

    if (message.isError) {
      const error = new Error(message.data?.message);
      Object.assign(error, message.data);
      error.stack += `\n${'------CONNECTION'.padEnd(50, '-')}\n${pending.stack}`;
      pending.reject(error);
    } else {
      pending.resolve({ data: message.data, commandId: message.commandId });
    }
  }

  private createPendingResult(): IResolvablePromiseWithId {
    const resolvablePromise = createPromise<ICoreResponsePayload>() as IResolvablePromiseWithId;
    this.lastId += 1;
    const id = this.lastId.toString();
    resolvablePromise.id = id;
    this.pendingRequestsById.set(id, resolvablePromise);
    return this.pendingRequestsById.get(id);
  }

  private onConnected(
    connectionParams: { maxConcurrency?: number; browserEmulatorIds?: string[] } = {},
  ): void {
    const { maxConcurrency, browserEmulatorIds } = connectionParams;
    if (!this.options.maxConcurrency || maxConcurrency < this.options.maxConcurrency) {
      log.info('Overriding max concurrency with Core value', {
        maxConcurrency,
        sessionId: null,
      });
      this.coreSessions.concurrency = maxConcurrency;
      this.options.maxConcurrency = maxConcurrency;
    }
    this.options.browserEmulatorIds ??= browserEmulatorIds ?? [];
  }
}

interface IResolvablePromiseWithId extends IResolvablePromise<ICoreResponsePayload> {
  id: string;
}
