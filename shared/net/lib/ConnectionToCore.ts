import { bindFunctions } from '@ulixee/commons/lib/utils';
import IResolvablePromise from '@ulixee/commons/interfaces/IResolvablePromise';
import Log from '@ulixee/commons/lib/Logger';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import SessionClosedOrMissingError from '@ulixee/commons/lib/SessionClosedOrMissingError';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import ICoreEventPayload from '../interfaces/ICoreEventPayload';
import ICoreResponsePayload from '../interfaces/ICoreResponsePayload';
import ITransportToCore from '../interfaces/ITransportToCore';
import PendingMessages from './PendingMessages';
import DisconnectedError from '../errors/DisconnectedError';
import ICoreRequestPayload from '../interfaces/ICoreRequestPayload';
import IApiHandlers, { IApiSpec } from '../interfaces/IApiHandlers';
import IUnixTime from '../interfaces/IUnixTime';

const { log } = Log(module);

export interface IConnectionToCoreEvents<IEventSpec> {
  disconnected: void;
  connected: void;
  event: ICoreEventPayload<IEventSpec, any>;
}
export default class ConnectionToCore<
  TCoreApiHandlers extends IApiHandlers,
  TEventSpec,
> extends TypedEventEmitter<IConnectionToCoreEvents<TEventSpec>> {
  public connectPromise: IResolvablePromise<Error | null>;
  public disconnectPromise: Promise<void>;

  public connectStartTime: IUnixTime;
  public didAutoConnect = false;

  public disconnectStartTime: IUnixTime;
  public disconnectError: Error;
  public get isConnectedToTransport(): boolean {
    return this.transport.isConnected && this.connectPromise?.isResolved;
  }

  public hooks: {
    afterConnectFn?: () => Promise<void>;
    beforeDisconnectFn?: () => Promise<void>;
  } = {};

  protected connectMessageId: string;
  protected disconnectMessageId: string;

  protected pendingMessages = new PendingMessages<
    ICoreResponsePayload<TCoreApiHandlers, any>['data']
  >();

  protected isConnectionTerminated: boolean;
  protected events = new EventSubscriber();

  private isSendingConnect = false;
  private isSendingDisconnect = false;

  constructor(public transport: ITransportToCore<TCoreApiHandlers, TEventSpec>) {
    super();
    bindFunctions(this);
    this.events.once(transport, 'disconnected', this.onConnectionTerminated.bind(this));
    this.events.on(transport, 'message', this.onMessage.bind(this));
  }

  public async connect(isAutoConnect = false, timeoutMs = 30e3): Promise<Error | null> {
    if (!this.connectPromise) {
      this.didAutoConnect = isAutoConnect;
      this.connectStartTime = Date.now();
      this.connectPromise = new Resolvable();
      try {
        const connectError = await this.transport.connect?.(timeoutMs);
        if (connectError) throw connectError;

        // disconnected during connect
        if (this.hasActiveSessions() && this.disconnectPromise && !this.didAutoConnect) {
          throw new DisconnectedError(this.transport.host);
        }

        // can be resolved if canceled by a disconnect
        if (!this.connectPromise.isResolved && this.hooks.afterConnectFn) {
          this.isSendingConnect = true;
          await this.hooks.afterConnectFn();
          this.isSendingConnect = false;
        }
        this.connectPromise.resolve();
        this.emit('connected');

        this.transport.isConnected = true;
        this.transport.emit('connected');
      } catch (err) {
        if (this.didAutoConnect) {
          this.connectPromise.resolve(err);
        } else {
          this.connectPromise.reject(err);
        }
      }
    }

    return this.connectPromise.promise;
  }

  public async disconnect(fatalError?: Error): Promise<void> {
    // user triggered disconnect sends a disconnect to Core
    this.disconnectStartTime = Date.now();
    this.disconnectError = fatalError;
    if (this.disconnectPromise) return this.disconnectPromise;
    const resolvable = new Resolvable<void>();
    this.disconnectPromise = resolvable.promise;

    try {
      const logid = log.stats('ConnectionToCore.Disconnecting', {
        host: this.transport.host,
        sessionId: null,
      });
      this.pendingMessages.cancel(new DisconnectedError(this.transport.host));

      this.isSendingDisconnect = true;
      await this.hooks.beforeDisconnectFn?.();
      this.isSendingDisconnect = false;

      await this.transport.disconnect?.();
      this.transport.isConnected = false;
      this.transport.emit('disconnected');
      this.emit('disconnected');
      log.stats('ConnectionToCore.Disconnected', {
        parentLogId: logid,
        host: this.transport.host,
        sessionId: null,
      });
    } finally {
      resolvable.resolve();
    }
    return this.disconnectPromise;
  }

  public async sendRequest<T extends keyof TCoreApiHandlers & string>(
    payload: {
      command: T;
      args: IApiSpec<TCoreApiHandlers>[T]['args'];
      commandId?: number;
      startTime?: IUnixTime;
    },
    timeoutMs?: number,
  ): Promise<ICoreResponsePayload<TCoreApiHandlers, T>['data']> {
    const isConnect = this.isSendingConnect;
    const isDisconnect = this.isSendingDisconnect;
    if (!isConnect && !isDisconnect) {
      const result = await this.connect();
      if (result) throw result;
    }

    const { promise, id } = this.pendingMessages.create(timeoutMs, isConnect || isDisconnect);
    if (isConnect) this.connectMessageId = id;
    if (isDisconnect) this.disconnectMessageId = id;

    try {
      const [result] = await Promise.all([
        promise,
        this.transport.send({
          ...payload,
          messageId: id,
          sendTime: Date.now(),
        } as ICoreRequestPayload<TCoreApiHandlers, T>),
      ]);
      return result;
    } catch (error) {
      this.pendingMessages.delete(id);
      if (this.disconnectPromise && error instanceof CanceledPromiseError) {
        return;
      }
      throw error;
    } finally {
      if (isConnect) this.connectMessageId = null;
      if (isDisconnect) this.disconnectMessageId = null;
    }
  }

  /**
   * Override fn to control active sessions
   */
  public hasActiveSessions(): boolean {
    return false;
  }

  protected onMessage(
    payload: ICoreResponsePayload<TCoreApiHandlers, any> | ICoreEventPayload<TEventSpec, any>,
  ): void {
    if ('responseId' in payload) {
      this.onResponse(payload);
    } else if ('listenerId' in payload || 'eventType' in payload) {
      this.onEvent(payload);
    } else {
      throw new Error(`message could not be processed: ${JSON.stringify(payload)}`);
    }
  }

  protected onResponse(message: ICoreResponsePayload<any, any>): void {
    const id = message.responseId;
    if (message.data instanceof Error) {
      let responseError = message.data;
      const isDisconnected =
        this.disconnectPromise ||
        responseError.name === SessionClosedOrMissingError.name ||
        (responseError as any).isDisconnecting === true;
      delete (responseError as any).isDisconnecting;

      if (isDisconnected && !isBrowserLaunchError(responseError)) {
        responseError = new DisconnectedError(this.transport.host);
      }
      this.pendingMessages.reject(id, responseError);
    } else {
      this.pendingMessages.resolve(id, message.data);
    }
  }

  protected onEvent(event: ICoreEventPayload<TEventSpec, any>): void {
    this.emit('event', event);
  }

  protected async onConnectionTerminated(): Promise<void> {
    if (this.isConnectionTerminated) return;
    this.isConnectionTerminated = true;
    this.emit('disconnected');

    if (this.connectMessageId) {
      this.onResponse({
        responseId: this.connectMessageId,
        data: !this.didAutoConnect ? new DisconnectedError(this.transport.host) : null,
      });
    }
    if (this.disconnectMessageId) {
      this.onResponse({
        responseId: this.disconnectMessageId,
        data: null,
      });
    }
    this.pendingMessages.cancel(new DisconnectedError(this.transport.host));
    this.isSendingDisconnect = true;
    await this.hooks.beforeDisconnectFn?.();
    this.isSendingDisconnect = false;
  }
}

function isBrowserLaunchError(error: Error): boolean {
  return error.name === 'BrowserLaunchError' || error.name === 'DependenciesMissingError';
}
