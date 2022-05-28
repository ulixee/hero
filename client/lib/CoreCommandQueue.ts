import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import SourceLoader from '@ulixee/commons/lib/SourceLoader';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import Queue from '@ulixee/commons/lib/Queue';
import ICoreCommandRequestPayload from '@ulixee/hero-interfaces/ICoreCommandRequestPayload';
import ConnectionToHeroCore from '../connections/ConnectionToHeroCore';
import { convertJsPathArgs } from './SetupAwaitedHandler';
import ICommandCounter from '../interfaces/ICommandCounter';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import { scriptInstance } from './internal';
import DisconnectedError from '@ulixee/net/errors/DisconnectedError';

export default class CoreCommandQueue {
  public static maxCommandRetries = 3;

  public mode: ISessionCreateOptions['mode'];
  public get lastCommandId(): number {
    return this.commandCounter?.lastCommandId;
  }

  public get lastCommand(): CoreCommandQueue['internalState']['lastCommand'] {
    return this.internalState.lastCommand;
  }

  public get commandMetadata(): Record<string, any> {
    return this.internalState.commandMetadata;
  }

  public get retryingCommand(): CoreCommandQueue['internalState']['retryingCommand'] {
    return this.internalState.retryingCommand;
  }

  public set retryingCommand(commandMeta: CoreCommandQueue['internalState']['retryingCommand']) {
    this.internalState.retryingCommand = commandMeta;
  }

  public get nextCommandId(): number {
    return this.commandCounter?.nextCommandId;
  }

  public get shouldRetryCommands(): boolean {
    return this.internalState.shouldRetryCommands;
  }

  public set shouldRetryCommands(shouldRetry: boolean) {
    this.internalState.shouldRetryCommands = shouldRetry;
  }

  private readonly internalState: {
    queue: Queue;
    commandsToRecord: ICoreCommandRequestPayload['recordCommands'];
    interceptFn?: (meta: ISessionMeta, command: string, ...args: any[]) => any;
    interceptQueue?: Queue;
    lastCommand?: Pick<
      ICoreCommandRequestPayload,
      'command' | 'commandId' | 'args' | 'callsite' | 'meta' | 'startTime'
    >;
    retryingCommand?: CoreCommandQueue['internalState']['lastCommand'];
    commandRetryHandlerFns: ((
      command: CoreCommandQueue['internalState']['lastCommand'],
      error: Error,
    ) => Promise<boolean>)[];
    commandMetadata?: Record<string, any>;
    isCheckingForRetry: boolean;
    shouldRetryCommands: boolean;
  };

  private readonly commandCounter?: ICommandCounter;
  private readonly sessionMarker: string = '';
  private readonly meta: ISessionMeta;
  private readonly connection: ConnectionToHeroCore;
  private flushOnTimeout: NodeJS.Timeout;
  private flushes: Promise<any>[] = [];

  private get internalQueue(): Queue {
    return this.internalState.queue;
  }

  constructor(
    meta: (ISessionMeta & { sessionName: string }) | null,
    mode: ISessionCreateOptions['mode'],
    connection: ConnectionToHeroCore,
    commandCounter: ICommandCounter,
    internalState?: CoreCommandQueue['internalState'],
  ) {
    this.connection = connection;
    this.mode = mode;
    if (meta) {
      const markers = [
        ''.padEnd(50, '-'),
        `------${meta.sessionName ?? ''}`.padEnd(50, '-'),
        `------${meta.sessionId ?? ''}`.padEnd(50, '-'),
        ''.padEnd(50, '-'),
      ].join('\n');
      this.sessionMarker = `\n\n${markers}`;
      this.meta = { sessionId: meta.sessionId, tabId: meta.tabId, frameId: meta.frameId };
    }
    this.commandCounter = commandCounter;

    this.internalState = internalState ?? {
      queue: new Queue('CORE COMMANDS', 1),
      commandsToRecord: [],
      commandRetryHandlerFns: [],
      isCheckingForRetry: false,
      shouldRetryCommands: true,
    };
  }

  public setCommandMetadata(metadata: Record<string, any>): void {
    this.internalState.commandMetadata ??= {};
    Object.assign(this.internalState.commandMetadata, metadata);
  }

  public registerCommandRetryHandlerFn(
    handlerFn: CoreCommandQueue['internalState']['commandRetryHandlerFns'][0],
  ): void {
    this.internalState.commandRetryHandlerFns.push(handlerFn);
  }

  public async intercept<T>(
    interceptCommandFn: (meta: ISessionMeta, command: string, ...args: any[]) => any,
    runCommandsToInterceptFn: () => Promise<T>,
  ): Promise<T> {
    this.internalState.interceptQueue ??= new Queue();

    return await this.internalState.interceptQueue.run(async () => {
      this.internalState.interceptFn = interceptCommandFn;
      try {
        return await runCommandsToInterceptFn();
      } finally {
        this.internalState.interceptFn = undefined;
      }
    });
  }

  public record(command: { command: string; args: any[]; commandId?: number }): void {
    this.internalState.commandsToRecord.push({
      ...command,
      startTime: Date.now(),
    });
    if (this.internalState.commandsToRecord.length > 1000) {
      this.flush().catch(() => null);
    } else if (!this.flushOnTimeout) {
      this.flushOnTimeout = setTimeout(() => this.flush(), 1e3).unref();
    }
  }

  public async flush(): Promise<void> {
    clearTimeout(this.flushOnTimeout);
    this.flushOnTimeout = null;
    if (!this.internalState.commandsToRecord.length) return;
    const recordCommands = [...this.internalState.commandsToRecord];
    this.internalState.commandsToRecord.length = 0;

    const flush = this.connection.sendRequest({
      meta: this.meta,
      command: 'Session.flush',
      commandId: this.nextCommandId,
      startTime: Date.now(),
      args: [],
      recordCommands,
    });
    this.flushes.push(flush);
    // wait for all pending flushes
    await Promise.all(this.flushes);

    const idx = this.flushes.indexOf(flush);
    if (idx >= 0) this.flushes.splice(idx, 1);
  }

  public async runOutOfBand<T>(command: string, ...args: any[]): Promise<T> {
    const commandId = this.nextCommandId;
    this.commandCounter?.emitter.emit('command', command, commandId, args);
    return await this.sendRequest({
      command,
      args,
      commandId,
      startTime: Date.now(),
      callsite: scriptInstance.getScriptCallsite(),
      ...(this.internalState.commandMetadata ?? {}),
    });
  }

  public run<T>(command: string, ...args: any[]): Promise<T> {
    clearTimeout(this.flushOnTimeout);
    this.flushOnTimeout = null;

    if (this.connection.disconnectPromise) {
      return Promise.resolve(null);
    }
    for (const arg of args) {
      if (Array.isArray(arg)) {
        convertJsPathArgs(arg);
      }
    }

    if (this.internalState.interceptFn) {
      const result = this.internalState.interceptFn(this.meta, command, ...args);
      if (result && result instanceof Error) {
        result.stack += `${this.sessionMarker}`;
        throw result;
      }
      return Promise.resolve(result as T);
    }
    const callsite = scriptInstance.getScriptCallsite();
    const commandId = this.nextCommandId;

    const commandPayload = {
      command,
      args,
      startTime: Date.now(),
      commandId,
      callsite,
      ...(this.internalState.commandMetadata ?? {}),
    };

    return this.internalQueue
      .run<T>(async () => {
        const recordCommands = [...this.internalState.commandsToRecord];
        this.internalState.commandsToRecord.length = 0;

        this.internalState.lastCommand = {
          meta: this.meta,
          ...commandPayload,
        };

        this.commandCounter?.emitter.emit('command', command, commandId, args);

        return await this.sendRequest<T>({
          ...commandPayload,
          recordCommands,
        });
      })
      .catch(error => {
        if (error instanceof DisconnectedError) throw error;

        this.internalState.retryingCommand = commandPayload;
        return this.tryRetryCommand<T>(error);
      })
      .catch(error => {
        if (!error.stack.includes(this.sessionMarker)) {
          error.stack += `${this.sessionMarker}`;
        }
        if (callsite?.length) {
          const lastLine = callsite[0];
          if (lastLine) {
            try {
              const code = SourceLoader.getSource(lastLine)?.code;
              if (code) {
                error.stack = `\n\n  --->  ${code.trim()}\n\n\n${error.stack}`;
              }
            } catch (_) {
              // drown if we can't read the source code
            }
          }
        }
        throw error;
      });
  }

  public willStop(): void {
    this.internalQueue.willStop();
  }

  public stop(cancelError: CanceledPromiseError): void {
    clearTimeout(this.flushOnTimeout);
    this.internalQueue.stop(cancelError);
  }

  public createSharedQueue(meta: ISessionMeta & { sessionName: string }): CoreCommandQueue {
    return new CoreCommandQueue(
      meta,
      this.mode,
      this.connection,
      this.commandCounter,
      this.internalState,
    );
  }

  private async sendRequest<T>(
    payload: Omit<ICoreCommandRequestPayload, 'meta' | 'messageId' | 'sendTime'>,
  ): Promise<T> {
    if (this.connection.disconnectPromise) {
      return Promise.resolve(null);
    }

    return await this.connection.sendRequest({
      meta: this.meta,
      ...payload,
    });
  }

  private async tryRetryCommand<T>(error: Error): Promise<T> {
    // don't retry within an existing "retry" run
    if (this.internalState.isCheckingForRetry || !this.shouldRetryCommands) throw error;

    // perform retries out of the "queue" so we don't get stuck
    let lastError = error;
    for (let retryNumber = 1; retryNumber < CoreCommandQueue.maxCommandRetries; retryNumber += 1) {
      const shouldRetry = await this.shouldRetryCommand(
        this.internalState.retryingCommand,
        lastError,
      );
      if (!shouldRetry) break;

      try {
        return await this.sendRequest<T>({
          ...this.internalState.retryingCommand,
          retryNumber,
        });
      } catch (nestedError) {
        lastError = nestedError;
      }
    }
    throw lastError;
  }

  private async shouldRetryCommand(
    command?: CoreCommandQueue['internalState']['lastCommand'],
    error?: Error,
  ): Promise<boolean> {
    for (const handler of this.internalState.commandRetryHandlerFns) {
      this.internalState.isCheckingForRetry = true;
      try {
        if (await handler(command, error)) {
          return true;
        }
      } finally {
        this.internalState.isCheckingForRetry = false;
      }
    }
    return false;
  }
}
