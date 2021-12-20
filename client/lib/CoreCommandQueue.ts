import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import Queue from '@ulixee/commons/lib/Queue';
import ICoreRequestPayload from '@ulixee/hero-interfaces/ICoreRequestPayload';
import ConnectionToCore from '../connections/ConnectionToCore';
import { convertJsPathArgs } from './SetupAwaitedHandler';
import ICommandCounter from '../interfaces/ICommandCounter';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import { scriptInstance } from './Hero';

export default class CoreCommandQueue {
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
    lastCommand?: Pick<
      ICoreRequestPayload,
      'command' | 'commandId' | 'args' | 'callsite' | 'meta' | 'startDate'
    >;
  };

  private readonly commandCounter?: ICommandCounter;
  private readonly sessionMarker: string = '';
  private readonly meta: ISessionMeta;
  private readonly connection: ConnectionToCore;
  private flushOnTimeout: NodeJS.Timeout;

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
    };
  }

  public intercept(
    interceptFn: (meta: ISessionMeta, command: string, ...args: any[]) => any,
  ): void {
    this.internalState.interceptFn = interceptFn;
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

    await this.connection.sendRequest({
      meta: this.meta,
      command: 'Session.flush',
      startDate: new Date(),
      args: [],
      recordCommands,
    });
  }

  public async runOutOfBand<T>(command: string, ...args: any[]): Promise<T> {
    return await this.sendRequest({
      command,
      args,
      commandId: this.nextCommandId,
      startDate: new Date(),
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

    let callsite: string;
    if (this.mode !== 'production') {
      callsite = JSON.stringify(scriptInstance.getScriptCallSite());
    }
    if (this.internalState.interceptFn) {
      const result = this.internalState.interceptFn(this.meta, command, ...args);
      if (result && result instanceof Error) {
        result.stack += `${this.sessionMarker}`;
        throw result;
      }
      return Promise.resolve(result as T);
    }

    const startDate = new Date();
    const commandId = this.nextCommandId;

    return this.internalQueue
      .run<T>(async () => {
        const recordCommands = [...this.internalState.commandsToRecord];
        this.internalState.commandsToRecord.length = 0;
        this.internalState.lastCommand = {
          meta: this.meta,
          command,
          args,
          startDate,
          commandId,
          callsite,
        };

        this.commandCounter?.emitter.emit('command', command, commandId, args);

        return await this.sendRequest<T>({
          command,
          args,
          startDate,
          commandId,
          recordCommands,
          callsite,
        });
      })
      .catch(error => {
        error.stack += `${this.sessionMarker}`;
        throw error;
      });
  }

  public willStop(): void {
    this.internalQueue.willStop();
  }

  public stop(cancelError: CanceledPromiseError): void {
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
}
