import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import TimeoutError from '@ulixee/commons/interfaces/TimeoutError';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import Log from '@ulixee/commons/lib/Logger';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import { isSemverSatisfied } from '@ulixee/commons/lib/VersionUtils';
import ICoreCommandRequestPayload from '@ulixee/hero-interfaces/ICoreCommandRequestPayload';
import ICoreListenerPayload from '@ulixee/hero-interfaces/ICoreListenerPayload';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import IConnectionToClient, {
  IConnectionToClientEvents,
} from '@ulixee/net/interfaces/IConnectionToClient';
import ICoreResponsePayload from '@ulixee/net/interfaces/ICoreResponsePayload';
import ITransport from '@ulixee/net/interfaces/ITransport';
import EmittingTransportToClient from '@ulixee/net/lib/EmittingTransportToClient';
import BrowserLaunchError from '@ulixee/unblocked-agent/errors/BrowserLaunchError';
import HeroCore from '../index';
import CommandRunner, { ICommandableTarget } from '../lib/CommandRunner';
import { ICommandPresetMeta } from '../lib/Commands';
import FrameEnvironment from '../lib/FrameEnvironment';
import RemoteEvents from '../lib/RemoteEvents';
import Session from '../lib/Session';
import Tab from '../lib/Tab';

const { version } = require('../package.json');

const { log } = Log(module);

export default class ConnectionToHeroClient
  extends TypedEventEmitter<IConnectionToClientEvents>
  implements IConnectionToClient<any, {}>, ICommandableTarget
{
  public disconnectPromise: Promise<void>;

  private get autoShutdownMillis(): number {
    return this.core?.clearIdleConnectionsAfterMillis ?? 0;
  }

  private autoShutdownTimer: NodeJS.Timeout;
  private readonly sessionIdToRemoteEvents = new Map<string, RemoteEvents>();
  private activeCommandMessageIds = new Set<string>();

  constructor(readonly transport: ITransport, private core: HeroCore) {
    super();
    transport.on('message', message => this.handleRequest(message));
    transport.once('disconnected', error => this.disconnect(error));
    this.sendEvent = this.sendEvent.bind(this);
    this.checkForAutoShutdown = this.checkForAutoShutdown.bind(this);
    this.disconnectIfInactive = this.disconnectIfInactive.bind(this);
  }

  ///////  CORE CONNECTION  /////////////////////////////////////////////////////////////////////////////////////

  public async handleRequest(payload: ICoreCommandRequestPayload): Promise<void> {
    const { messageId, command, meta, recordCommands, ...nextCommandMeta } = payload;
    const session = meta?.sessionId ? Session.get(meta.sessionId) : undefined;

    // json converts args to null which breaks undefined argument handlers
    const args = payload.args.map(x => (x === null ? undefined : x));

    let data: any;
    try {
      this.activeCommandMessageIds.add(messageId);
      if (recordCommands) await this.recordCommands(meta, payload.sendTime, recordCommands);
      data = await this.executeCommand(command, args, meta, nextCommandMeta);

      // make sure to get tab metadata
      data = this.serializeToMetadata(data);
    } catch (error) {
      const isClosing = session?.isClosing || !!this.disconnectPromise;
      // if we're closing, don't emit errors
      let shouldSkipLogging = isClosing && error instanceof CanceledPromiseError;

      // don't log timeouts when explicitly provided timeout (NOTE: doesn't cover goto)
      if (args && error instanceof TimeoutError) {
        for (const arg of args) {
          if (arg && !Number.isNaN(arg.timeoutMs)) {
            shouldSkipLogging = true;
          }
        }
      }

      const isLaunchError = this.isLaunchError(error);
      const isDirect = this.transport instanceof EmittingTransportToClient;

      if ((isDirect === false && shouldSkipLogging === false) || isLaunchError) {
        log.error('ConnectionToClient.HandleRequestError', {
          error,
          sessionId: meta?.sessionId,
        });
      }
      data = this.serializeError(error);
      data.isDisconnecting = isClosing;
    } finally {
      this.activeCommandMessageIds.delete(messageId);
    }

    const response: ICoreResponsePayload<any, any> = {
      responseId: messageId,
      data,
    };
    try {
      await this.transport.send(response);
    } catch (err) {
      if (err instanceof CanceledPromiseError || String(err).includes('Websocket was not open'))
        return;
      throw err;
    }
  }

  public async connect(
    options: { maxConcurrentClientCount?: number; version?: string } = {},
  ): Promise<{ maxConcurrency: number }> {
    if (options.version) {
      if (!isSemverSatisfied(options.version, version)) {
        throw new Error(
          `This Hero Core (version=${version}) cannot satisfy the requested version (${options.version}).`,
        );
      }
    }
    if (
      options.maxConcurrentClientCount &&
      options.maxConcurrentClientCount < this.core.pool.maxConcurrentAgents
    ) {
      this.core.pool.maxConcurrentAgents = options.maxConcurrentClientCount;
    }
    this.disconnectPromise = null;
    await this.core.start();
    return {
      maxConcurrency: this.core.pool.maxConcurrentAgents,
    };
  }

  public logUnhandledError(error: Error, fatalError = false): void {
    if (fatalError) {
      log.error('ConnectionToClient.UnhandledError(fatal)', {
        clientError: error,
        sessionId: null,
      });
    } else {
      log.error('ConnectionToClient.UnhandledErrorOrRejection', {
        clientError: error,
        sessionId: null,
      });
    }
  }

  public async disconnect(fatalError?: Error): Promise<void> {
    if (this.disconnectPromise) return this.disconnectPromise;
    const resolvable = new Resolvable<void>();
    this.disconnectPromise = resolvable.promise;
    try {
      const logId = log.stats('ConnectionToClient.Disconnecting', { sessionId: null, fatalError });
      clearTimeout(this.autoShutdownTimer);
      const closeAll: Promise<any>[] = [];
      for (const id of this.sessionIdToRemoteEvents.keys()) {
        const session = Session.get(id);
        if (session) closeAll.push(session.close(true).catch(err => err));
      }

      await Promise.all([...closeAll, this.transport.disconnect?.(fatalError)]);
      this.emit('disconnected', fatalError);
      log.stats('ConnectionToClient.Disconnected', { sessionId: null, parentLogId: logId });
    } finally {
      resolvable.resolve();
      this.core = null;
    }
  }

  public isActive(): boolean {
    return this.sessionIdToRemoteEvents.size > 0 || this.activeCommandMessageIds.size > 0;
  }

  public isAllowedCommand(method: string): boolean {
    return (
      method === 'connect' ||
      method === 'disconnect' ||
      method === 'logUnhandledError' ||
      method === 'createSession'
    );
  }

  public sendEvent(message: ICoreListenerPayload): void {
    void this.transport
      .send(message)
      .catch(error => log.error('ERROR sending message', { error, message, sessionId: null }));
  }

  ///////  SESSION /////////////////////////////////////////////////////////////////////////////////////////////////////

  public async createSession(options: ISessionCreateOptions = {}): Promise<ISessionMeta> {
    if (this.disconnectPromise) throw new Error('Connection closed');
    clearTimeout(this.autoShutdownTimer);

    const { session, tab } = await Session.create(options, this.core);
    const sessionId = session.id;
    if (!this.sessionIdToRemoteEvents.has(sessionId)) {
      const remoteEvents = new RemoteEvents(session, this.sendEvent);
      this.sessionIdToRemoteEvents.set(sessionId, remoteEvents);
      session.once('closing', () => this.sessionIdToRemoteEvents.delete(sessionId));
      session.once('closed', this.checkForAutoShutdown);
    }
    return { tabId: tab?.id, sessionId: session.id, frameId: tab?.mainFrameId };
  }

  /////// INTERNAL FUNCTIONS /////////////////////////////////////////////////////////////////////////////

  private async recordCommands(
    meta: ISessionMeta,
    sendTime: number,
    recordCommands: ICoreCommandRequestPayload['recordCommands'],
  ): Promise<void> {
    if (!recordCommands.length) return;

    const promises: Promise<any>[] = [];
    for (const { command, args, commandId, startTime } of recordCommands) {
      const cleanArgs = args.map(x => (x === null ? undefined : x));
      const promise = this.executeCommand(command, cleanArgs, meta, {
        commandId,
        startTime,
        sendTime,
      }).catch(error => {
        log.warn('RecordingCommandsFailed', {
          sessionId: meta.sessionId,
          error,
          command,
        });
      });
      promises.push(promise);
    }
    await Promise.all(promises);
  }

  private async executeCommand(
    command: string,
    args: any[],
    meta: ISessionMeta,
    commandMeta: ICommandPresetMeta,
  ): Promise<any> {
    const session = Session.get(meta?.sessionId);
    const tab = Session.getTab(meta);
    const frame = tab?.getFrameEnvironment(meta?.frameId);
    const events = this.sessionIdToRemoteEvents.get(meta?.sessionId);

    const commandRunner = new CommandRunner(command, args, {
      Session: session,
      Events: events?.getEventTarget(meta),
      Core: this,
      Tab: tab,
      FrameEnvironment: frame,
    });

    if (session && commandMeta) {
      session.commands.presetMeta = commandMeta;
    }

    return await commandRunner.runFn();
  }

  private disconnectIfInactive(): Promise<void> {
    if (this.isActive() || this.autoShutdownMillis <= 0) return;
    return this.disconnect();
  }

  private checkForAutoShutdown(): void {
    if (this.autoShutdownMillis <= 0) return;
    clearTimeout(this.autoShutdownTimer);
    this.autoShutdownTimer = setTimeout(this.disconnectIfInactive, this.autoShutdownMillis).unref();
  }

  private isLaunchError(error: Error): boolean {
    return (
      error instanceof BrowserLaunchError ||
      error.name === 'BrowserLaunchError' ||
      error.name === 'DependenciesMissingError'
    );
  }

  private serializeToMetadata(data: any): any {
    if (!data || typeof data !== 'object') return data;
    if (data instanceof Tab || data instanceof FrameEnvironment) {
      return data.toJSON();
    }

    if (Array.isArray(data)) {
      return data.map(x => this.serializeToMetadata(x));
    }

    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Tab || value instanceof FrameEnvironment) data[key] = value.toJSON();
    }

    return data;
  }

  private serializeError(error: Error): object {
    if (this.isLaunchError(error)) {
      const message = `Ulixee Cloud failed to launch Chrome - ${error.message}. See Cloud console logs for details.`;
      error.stack = error.stack.replace(error.message, message);
      error.message = message;
    }
    if (error instanceof Error) return error;

    return new Error(`Unknown error occurred ${error}`);
  }
}
