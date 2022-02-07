import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import Queue from '@ulixee/commons/lib/Queue';
import ICoreRequestPayload from '@ulixee/hero-interfaces/ICoreRequestPayload';
import ConnectionToCore from '../connections/ConnectionToCore';
import { convertJsPathArgs } from './SetupAwaitedHandler';
import ICommandCounter from '../interfaces/ICommandCounter';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import { scriptInstance } from './Hero';
import DisconnectedFromCoreError from '../connections/DisconnectedFromCoreError';

export default class CoreCommandQueue {
  public static maxCommandRetries = 3;

  public mode: ISessionCreateOptions['mode'];
  public get lastCommandId(): number {
    return this.commandCounter?.lastCommandId;
  }

  public get lastCommand(): CoreCommandQueue['internalState']['lastCommand'] {
    return this.internalState.lastCommand;
  }

  public get nextCommandId(): number {
    return this.commandCounter?.nextCommandId;
  }

  private readonly internalState: {
    queue: Queue;
    commandsToRecord: ICoreRequestPayload['recordCommands'];
    interceptFn?: (meta: ISessionMeta, command: string, ...args: any[]) => any;
    interceptQueue?: Queue;
    lastCommand?: Pick<
      ICoreRequestPayload,
      'command' | 'commandId' | 'args' | 'callsite' | 'meta' | 'startDate'
    >;
    commandRetryHandlerFns: ((
      command: CoreCommandQueue['internalState']['lastCommand'],
      error: Error,
    ) => Promise<boolean>)[];
    commandMetadata?: Record<string, any>;
    isRetrying: boolean;
  };

  private readonly commandCounter?: ICommandCounter;
  private readonly sessionMarker: string = '';
  private readonly meta: ISessionMeta;
  private readonly connection: ConnectionToCore;
  private flushOnTimeout: NodeJS.Timeout;
  private flushes: Promise<any>[] = [];

  private get internalQueue(): Queue {
    return this.internalState.queue;
  }

  constructor(
    meta: (ISessionMeta & { sessionName: string }) | null,
    mode: ISessionCreateOptions['mode'],
    connection: ConnectionToCore,
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
      isRetrying: false,
    };
  }

  public setCommandMetadata(metadata: Record<string, any>): void {
    this.internalState.commandMetadata = metadata;
  }

  public registerCommandRetryHandlerFn(
    handlerFn: CoreCommandQueue['internalState']['commandRetryHandlerFns'][0],
  ): void {
    this.internalState.commandRetryHandlerFns.push(handlerFn);
  }

  public async intercept<T>(
    interceptCommandFn: (meta: ISessionMeta, command: string, ...args: any[]) => any,
    runFn: () => Promise<T>,
  ): Promise<T> {
    this.internalState.interceptQueue ??= new Queue();

    return await this.internalState.interceptQueue.run(async () => {
      this.internalState.interceptFn = interceptCommandFn;
      try {
        return await runFn();
      } finally {
        this.internalState.interceptFn = undefined;
      }
    });
  }

  public record(command: { command: string; args: any[]; commandId?: number }): void {
    this.internalState.commandsToRecord.push({
      ...command,
      startDate: new Date(),
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
      startDate: new Date(),
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
      startDate: new Date(),
      callsite: this.getCallsite(),
      ...(this.internalState.commandMetadata ?? {}),
    });
  }

  public run<T>(command: string, ...args: any[]): Promise<T> {
    clearTimeout(this.flushOnTimeout);
    this.flushOnTimeout = null;

    if (this.connection.isDisconnecting) {
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
    const callsite = this.getCallsite();
    const commandId = this.nextCommandId;

    const commandPayload = {
      command,
      args,
      startDate: new Date(),
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

        return await this.sendRequest<T>({ ...commandPayload, recordCommands });
      })
      .catch(error => {
        if (error instanceof DisconnectedFromCoreError) throw error;
        return this.retryCommand<T>(commandPayload, error);
      })
      .catch(error => {
        if (!error.stack.includes(this.sessionMarker)) {
          error.stack += `${this.sessionMarker}`;
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

  private getCallsite(): string {
    if (this.mode !== 'production') {
      return JSON.stringify(scriptInstance.getScriptCallsite());
    }
  }

  private async sendRequest<T>(
    payload: Omit<ICoreRequestPayload, 'meta' | 'messageId' | 'sendDate'>,
  ): Promise<T> {
    if (this.connection.isDisconnecting) {
      return Promise.resolve(null);
    }

    const response = await this.connection.sendRequest({
      meta: this.meta,
      ...payload,
    });

    if (response) {
      return response.data;
    }
  }

  private async retryCommand<T>(
    commandPayload: CoreCommandQueue['internalState']['lastCommand'],
    error: Error,
  ): Promise<T> {
    // don't retry within an existing "retry" run
    if (this.internalState.isRetrying) throw error;

    // perform retries out of the "queue" so we don't get stuck
    let lastError = error;
    for (let count = 1; count < CoreCommandQueue.maxCommandRetries; count += 1) {
      const shouldRetry = await this.shouldRetryCommand(commandPayload, lastError);
      if (!shouldRetry) break;

      try {
        return await this.sendRequest<T>({ ...commandPayload, retryNumber: count });
      } catch (nestedError) {
        lastError = nestedError;
      }
    }
    throw lastError;
  }

  private async shouldRetryCommand(
    command: CoreCommandQueue['internalState']['lastCommand'],
    error: Error,
  ): Promise<boolean> {
    for (const handler of this.internalState.commandRetryHandlerFns) {
      this.internalState.isRetrying = true;
      try {
        if (await handler(command, error)) {
          return true;
        }
      } finally {
        this.internalState.isRetrying = false;
      }
    }
    return false;
  }
}
