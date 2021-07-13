import ISessionMeta from '@secret-agent/interfaces/ISessionMeta';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import Queue from '@secret-agent/commons/Queue';
import ICoreRequestPayload from '@secret-agent/interfaces/ICoreRequestPayload';
import ConnectionToCore from '../connections/ConnectionToCore';
import { convertJsPathArgs } from './SetupAwaitedHandler';
import ICommandCounter from '../interfaces/ICommandCounter';

export default class CoreCommandQueue {
  public get lastCommandId(): number {
    return this.commandCounter?.lastCommandId;
  }

  public get nextCommandId(): number {
    return this.commandCounter?.nextCommandId;
  }

  private readonly internalState: {
    queue: Queue;
    commandsToRecord: ICoreRequestPayload['recordCommands'];
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
    connection: ConnectionToCore,
    commandCounter: ICommandCounter,
    internalState?: CoreCommandQueue['internalState'],
  ) {
    this.connection = connection;
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
    const startTime = new Date();
    const commandId = this.nextCommandId;
    return this.internalQueue
      .run<T>(async () => {
        const recordCommands = [...this.internalState.commandsToRecord];
        this.internalState.commandsToRecord.length = 0;

        const response = await this.connection.sendRequest({
          meta: this.meta,
          command,
          args,
          startDate: startTime,
          commandId,
          recordCommands,
        });

        let data: T = null;
        if (response) {
          data = response.data;
        }
        return data;
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
    return new CoreCommandQueue(meta, this.connection, this.commandCounter, this.internalState);
  }
}
