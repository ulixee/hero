import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import ICoreRequestPayload from '@ulixee/hero-interfaces/ICoreRequestPayload';
import ICoreResponsePayload from '@ulixee/hero-interfaces/ICoreResponsePayload';
import ICoreConfigureOptions from '@ulixee/hero-interfaces/ICoreConfigureOptions';
import ICoreEventPayload from '@ulixee/hero-interfaces/ICoreEventPayload';
import Log from '@ulixee/commons/lib/Logger';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import PuppetLaunchError from '@ulixee/hero-puppet/lib/PuppetLaunchError';
import TimeoutError from '@ulixee/commons/interfaces/TimeoutError';
import Session from '../lib/Session';
import Tab from '../lib/Tab';
import GlobalPool from '../lib/GlobalPool';
import Core from '../index';
import FrameEnvironment from '../lib/FrameEnvironment';
import CommandRunner, { ICommandableTarget } from '../lib/CommandRunner';
import RemoteEvents from '../lib/RemoteEvents';

const { log } = Log(module);

export default class ConnectionToClient
  extends TypedEventEmitter<{
    close: { fatalError?: Error };
    message: ICoreResponsePayload | ICoreEventPayload;
  }>
  implements ICommandableTarget
{
  public isClosing = false;
  public isPersistent = true;
  public autoShutdownMillis = 500;

  private autoShutdownTimer: NodeJS.Timer;
  private readonly sessionIdToRemoteEvents = new Map<string, RemoteEvents>();
  private hasActiveCommand = false;

  ///////  CORE SERVER CONNECTION  /////////////////////////////////////////////////////////////////////////////////////

  public async handleRequest(payload: ICoreRequestPayload): Promise<void> {
    const {
      commandId,
      startDate,
      sendDate,
      messageId,
      command,
      meta,
      recordCommands,
      callsite,
      retryNumber,
      activeFlowHandlerId,
    } = payload;
    const session = meta?.sessionId ? Session.get(meta.sessionId) : undefined;

    // json converts args to null which breaks undefined argument handlers
    const args = payload.args.map(x => (x === null ? undefined : x));

    let data: any;
    try {
      this.hasActiveCommand = true;
      if (recordCommands) await this.recordCommands(meta, sendDate, recordCommands);
      data = await this.executeCommand(command, args, meta, {
        commandId,
        startDate,
        sendDate,
        callsite,
        retryNumber,
        activeFlowHandlerId,
      });

      // make sure to get tab metadata
      data = this.serializeToMetadata(data);
    } catch (error) {
      const isClosing = session?.isClosing || this.isClosing;
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

      const isChildProcess = !!process.send;
      const isLaunchError = this.isLaunchError(error);

      if ((isChildProcess === false && shouldSkipLogging === false) || isLaunchError) {
        log.error('ConnectionToClient.HandleRequestError', {
          error,
          sessionId: meta?.sessionId,
        });
      }
      data = this.serializeError(error);
      data.isDisconnecting = isClosing;
    } finally {
      this.hasActiveCommand = false;
    }

    const response: ICoreResponsePayload = {
      responseId: messageId,
      data,
    };
    this.emit('message', response);
  }

  public async connect(
    options: ICoreConfigureOptions & { isPersistent?: boolean } = {},
  ): Promise<{ maxConcurrency: number }> {
    this.isPersistent = options.isPersistent ?? true;
    this.isClosing = false;
    await Core.start(options, false);
    return {
      maxConcurrency: GlobalPool.maxConcurrentClientCount,
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
    if (this.isClosing) return;
    this.isClosing = true;
    const logId = log.stats('ConnectionToClient.Disconnecting', { sessionId: null, fatalError });
    clearTimeout(this.autoShutdownTimer);
    const closeAll: Promise<any>[] = [];
    for (const id of this.sessionIdToRemoteEvents.keys()) {
      const session = Session.get(id);
      if (session) closeAll.push(session.close().catch(err => err));
    }
    await Promise.all(closeAll);
    this.isPersistent = false;
    this.emit('close', { fatalError });
    log.stats('ConnectionToClient.Disconnected', { sessionId: null, parentLogId: logId });
  }

  public isActive(): boolean {
    return this.sessionIdToRemoteEvents.size > 0 || this.isPersistent || this.hasActiveCommand;
  }

  public isAllowedCommand(method: string): boolean {
    return (
      method === 'connect' ||
      method === 'disconnect' ||
      method === 'logUnhandledError' ||
      method === 'createSession'
    );
  }

  ///////  SESSION /////////////////////////////////////////////////////////////////////////////////////////////////////

  public async createSession(options: ISessionCreateOptions = {}): Promise<ISessionMeta> {
    if (this.isClosing) throw new Error('Connection closed');
    clearTimeout(this.autoShutdownTimer);

    const { session, tab } = await Session.create(options);
    const sessionId = session.id;
    if (!this.sessionIdToRemoteEvents.has(sessionId)) {
      this.sessionIdToRemoteEvents.set(
        sessionId,
        new RemoteEvents(this.emit.bind(this, 'message')),
      );
      session.once('closing', () => this.sessionIdToRemoteEvents.delete(sessionId));
      session.once('closed', () => this.checkForAutoShutdown());
    }
    return { tabId: tab.id, sessionId: session.id, frameId: tab.mainFrameId };
  }

  /////// INTERNAL FUNCTIONS /////////////////////////////////////////////////////////////////////////////

  private async recordCommands(
    meta: ISessionMeta,
    sendDate: Date,
    recordCommands: ICoreRequestPayload['recordCommands'],
  ): Promise<void> {
    if (!recordCommands.length) return;

    const promises: Promise<any>[] = [];
    for (const { command, args, commandId, startDate } of recordCommands) {
      const cleanArgs = args.map(x => (x === null ? undefined : x));
      const promise = this.executeCommand(command, cleanArgs, meta, {
        commandId,
        startDate,
        sendDate,
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
    commandMeta: {
      commandId: number;
      startDate: Date;
      sendDate: Date;
      callsite?: string;
      retryNumber?: number;
      activeFlowHandlerId?: number;
    },
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
      session.commands.nextCommandMeta = commandMeta;
    }

    return await commandRunner.runFn();
  }

  private checkForAutoShutdown(): void {
    clearTimeout(this.autoShutdownTimer);
    this.autoShutdownTimer = setTimeout(() => {
      if (this.isActive()) return;
      return this.disconnect();
    }, this.autoShutdownMillis).unref();
  }

  private isLaunchError(error: Error): boolean {
    return error instanceof PuppetLaunchError || error.name === 'DependenciesMissingError';
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
      return new Error(
        'CoreServer needs further setup to launch the browserEmulator. See server logs.',
      );
    }
    if (error instanceof Error) return error;

    return new Error(`Unknown error occurred ${error}`);
  }
}
