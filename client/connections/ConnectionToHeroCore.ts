import Log from '@ulixee/commons/lib/Logger';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import ICoreConfigureOptions from '@ulixee/hero-interfaces/ICoreConfigureOptions';
import { ConnectionToCore, WsTransportToCore } from '@ulixee/net';
import ICoreListenerPayload from '@ulixee/hero-interfaces/ICoreListenerPayload';
import ITransportToCore from '@ulixee/net/interfaces/ITransportToCore';
import addGlobalInstance from '@ulixee/commons/lib/addGlobalInstance';
import ICoreCommandRequestPayload from '@ulixee/hero-interfaces/ICoreCommandRequestPayload';
import DisconnectedError from '@ulixee/net/errors/DisconnectedError';
import ICoreResponsePayload from '@ulixee/net/interfaces/ICoreResponsePayload';
import IConnectionToCoreOptions from '../interfaces/IConnectionToCoreOptions';
import CoreCommandQueue from '../lib/CoreCommandQueue';
import CoreSession from '../lib/CoreSession';
import CoreSessions from '../lib/CoreSessions';
import DisconnectedFromCoreError from './DisconnectedFromCoreError';
import CallsiteLocator from '../lib/CallsiteLocator';

const { log } = Log(module);

export default class ConnectionToHeroCore extends ConnectionToCore<any, {}> {
  public readonly commandQueue: CoreCommandQueue;
  public options: IConnectionToCoreOptions;

  private coreSessions: CoreSessions;

  constructor(
    transport: ITransportToCore<any, any, ICoreCommandRequestPayload>,
    options?: Omit<IConnectionToCoreOptions, 'host'>,
    callsiteLocator?: CallsiteLocator,
  ) {
    super(transport);
    this.options = options ?? {};
    this.commandQueue = new CoreCommandQueue(
      null,
      this,
      null,
      callsiteLocator ?? new CallsiteLocator(),
    );
    this.coreSessions = new CoreSessions(
      this,
      this.options.maxConcurrency,
      this.options.instanceTimeoutMillis,
    );

    this.hooks.afterConnectFn = this.afterConnect.bind(this);
    this.hooks.beforeDisconnectFn = this.beforeDisconnect.bind(this);
  }

  ///////  SESSION FUNCTIONS  //////////////////////////////////////////////////////////////////////////////////////////

  public override sendRequest(
    payload: Omit<ICoreCommandRequestPayload, 'messageId' | 'sendTime'>,
    timeoutMs?: number,
  ): Promise<ICoreResponsePayload<any, any>['data']> {
    return super.sendRequest(payload, timeoutMs);
  }

  public override hasActiveSessions(): boolean {
    return this.coreSessions.size > 0;
  }

  public async createSession(
    options: ISessionCreateOptions,
    callsiteLocator: CallsiteLocator,
  ): Promise<CoreSession> {
    try {
      return await this.coreSessions.create(options, callsiteLocator);
    } catch (error) {
      if (error instanceof DisconnectedError && this.disconnectPromise) return null;
      throw error;
    }
  }

  public getSession(sessionId: string): CoreSession {
    return this.coreSessions.get(sessionId);
  }

  public async logUnhandledError(error: Error): Promise<void> {
    await this.commandQueue.run('Core.logUnhandledError', error);
  }

  protected async afterConnect(): Promise<void> {
    const connectOptions = <ICoreConfigureOptions>{
      dataDir: this.options.dataDir,
      version: this.options.version,
    };
    const connectResult = await this.sendRequest({
      startTime: super.connectStartTime,
      command: 'Core.connect',
      args: [connectOptions],
    });
    if (connectResult) {
      const { maxConcurrency } = connectResult;
      if (
        maxConcurrency &&
        (!this.options.maxConcurrency || maxConcurrency < this.options.maxConcurrency)
      ) {
        log.info('Overriding max concurrency with Core value', {
          maxConcurrency,
          sessionId: null,
        });
        this.coreSessions.concurrency = maxConcurrency;
        this.options.maxConcurrency = maxConcurrency;
      }
    }
  }

  protected async beforeDisconnect(): Promise<void> {
    const hasSessions = this.coreSessions?.size > 0;
    this.commandQueue.stop(new DisconnectedFromCoreError(this.transport.host));
    this.coreSessions.stop(
      !this.transport.isConnected && !this.connectPromise
        ? new Error(`No host connection was established (${this.transport.host})`)
        : new DisconnectedFromCoreError(this.transport.host),
    );

    if (!this.connectPromise) return;

    if (!this.connectPromise.isResolved) {
      let result;
      if (hasSessions && !this.didAutoConnect) {
        result = new DisconnectedFromCoreError(this.transport.host);
      }
      this.connectPromise.resolve(result);
    }

    if (this.transport.isConnected) {
      await this.sendRequest(
        {
          command: 'Core.disconnect',
          startTime: this.disconnectStartTime,
          args: [this.disconnectError],
        },
        2e3,
      ).catch(err => err);
    }
  }

  protected override onEvent(payload: ICoreListenerPayload): void {
    const { meta, listenerId, data, lastCommandId } = payload;
    const session = this.getSession(meta.sessionId);
    session?.onEvent(meta, listenerId, data, lastCommandId);
    this.emit('event', payload);
  }

  public static remote(address: string): ConnectionToHeroCore {
    address = ConnectionToHeroCore.resolveHost(address);
    const transport = new WsTransportToCore(address);
    return new ConnectionToHeroCore(transport);
  }

  public static resolveHost(host: string): string {
    if (host.endsWith('/hero')) return host;

    if (!host.endsWith('/')) host += '/';
    if (!host.endsWith('hero')) host += 'hero';
    return host;
  }
}

addGlobalInstance(ConnectionToHeroCore);
