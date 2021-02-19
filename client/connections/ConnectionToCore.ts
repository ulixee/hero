import ICoreRequestPayload from '@secret-agent/core-interfaces/ICoreRequestPayload';
import ICoreEventPayload from '@secret-agent/core-interfaces/ICoreEventPayload';
import ICoreResponsePayload from '@secret-agent/core-interfaces/ICoreResponsePayload';
import { createPromise } from '@secret-agent/commons/utils';
import IResolvablePromise from '@secret-agent/core-interfaces/IResolvablePromise';
import Log from '@secret-agent/commons/Logger';
import ICreateSessionOptions from '@secret-agent/core-interfaces/ICreateSessionOptions';
import ISessionMeta from '@secret-agent/core-interfaces/ISessionMeta';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import ICoreConfigureOptions from '@secret-agent/core-interfaces/ICoreConfigureOptions';
import IConnectionToCoreOptions from '../interfaces/IConnectionToCoreOptions';
import CoreCommandQueue from '../lib/CoreCommandQueue';
import CoreSession from '../lib/CoreSession';
import { IAgentCreateOptions } from '../index';
import Agent from '../lib/Agent';
import CoreSessions from '../lib/CoreSessions';
import DisconnectedFromCoreError from './DisconnectedFromCoreError';

const { log } = Log(module);

export default abstract class ConnectionToCore {
  public readonly commandQueue: CoreCommandQueue;
  public readonly hostOrError: Promise<string | Error>;
  public options: IConnectionToCoreOptions;

  private connectPromise: Promise<Error | null>;
  private isClosing = false;

  private coreSessions: CoreSessions;
  private readonly pendingRequestsById = new Map<string, IResolvablePromiseWithId>();
  private lastId = 0;

  constructor(options?: IConnectionToCoreOptions) {
    this.options = options ?? { isPersistent: true };
    this.commandQueue = new CoreCommandQueue(null, this);
    this.coreSessions = new CoreSessions(
      this.options.maxConcurrency,
      this.options.agentTimeoutMillis,
    );

    if (this.options.host) {
      this.hostOrError = Promise.resolve(this.options.host)
        .then(x => {
          if (!x.includes('://')) {
            return `ws://${x}`;
          }
          return x;
        })
        .catch(err => err);
    } else {
      this.hostOrError = Promise.resolve(new Error('No host provided'));
    }
    this.disconnect = this.disconnect.bind(this);
  }

  protected abstract internalSendRequest(payload: ICoreRequestPayload): Promise<void>;
  protected abstract createConnection(): Promise<Error | null>;
  protected abstract destroyConnection(): Promise<any>;

  public connect(): Promise<Error | null> {
    this.connectPromise ??= this.createConnection()
      .then(err => {
        if (err) throw err;
        return this.internalSendRequestAndWait({
          command: 'connect',
          args: [
            <ICoreConfigureOptions & { isPersistent: boolean }>{
              coreServerPort: this.options.coreServerPort,
              browserEmulatorIds: this.options.browserEmulatorIds,
              localProxyPortStart: this.options.localProxyPortStart,
              sessionsDir: this.options.sessionsDir,
              isPersistent: this.options.isPersistent,
            },
          ],
        });
      })
      .then(result => this.onConnected(result.data))
      .catch(err => err);

    return this.connectPromise;
  }

  public async disconnect(fatalError?: Error): Promise<void> {
    if (this.isClosing) return;
    this.isClosing = true;
    const logid = log.stats('ConnectionToCore.Disconnecting', {
      host: this.hostOrError,
      sessionId: null,
    });

    await this.cancelPendingRequests();
    if (this.connectPromise) {
      await this.internalSendRequestAndWait(
        {
          command: 'disconnect',
          args: [fatalError],
        },
        2e3,
      );
    }
    await this.destroyConnection();
    log.stats('ConnectionToCore.Disconnected', {
      parentLogId: logid,
      host: this.hostOrError,
      sessionId: null,
    });
  }

  ///////  PIPE FUNCTIONS  /////////////////////////////////////////////////////////////////////////////////////////////

  public async sendRequest(
    payload: Omit<ICoreRequestPayload, 'messageId'>,
  ): Promise<ICoreResponsePayload> {
    const result = await this.connect();
    if (result) throw result;

    return this.internalSendRequestAndWait(payload);
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
        connectionToCore: this,
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

  protected async internalSendRequestAndWait(
    payload: Omit<ICoreRequestPayload, 'messageId'>,
    timeoutMs?: number,
  ): Promise<ICoreResponsePayload> {
    const { promise, id, resolve } = this.createPendingResult();

    let timeout: NodeJS.Timeout;
    if (timeoutMs) timeout = setTimeout(() => resolve(null), timeoutMs).unref();
    try {
      await this.internalSendRequest({
        messageId: id,
        ...payload,
      });
    } catch (error) {
      clearTimeout(timeout);
      if (error instanceof CanceledPromiseError) {
        this.pendingRequestsById.delete(id);
        return;
      }
      throw error;
    }

    // now run to completion with timeout
    try {
      return await promise;
    } finally {
      clearTimeout(timeout);
    }
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

    if (message.data instanceof Error) {
      this.rejectPendingRequest(pending, message.data);
    } else {
      pending.resolve({ data: message.data, commandId: message.commandId });
    }
  }

  protected async cancelPendingRequests(): Promise<void> {
    this.commandQueue.clearPending();
    const host = String(await this.hostOrError);
    this.coreSessions.close(new DisconnectedFromCoreError(host));
    const pending = [...this.pendingRequestsById.values()];
    this.pendingRequestsById.clear();
    for (const entry of pending) {
      this.rejectPendingRequest(entry, new DisconnectedFromCoreError(host));
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

  private rejectPendingRequest(pending: IResolvablePromiseWithId, error: Error): void {
    error.stack += `\n${'------CONNECTION'.padEnd(50, '-')}\n${pending.stack}`;
    pending.reject(error);
  }

  private onConnected(
    connectionParams: { maxConcurrency?: number; browserEmulatorIds?: string[] } = {},
  ): void {
    this.isClosing = false;
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
