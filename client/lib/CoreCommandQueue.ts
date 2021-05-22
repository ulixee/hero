import ISessionMeta from '@secret-agent/interfaces/ISessionMeta';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import Queue from '@secret-agent/commons/Queue';
import ConnectionToCore from '../connections/ConnectionToCore';
import { convertJsPathArgs } from './SetupAwaitedHandler';

export default class CoreCommandQueue {
  public lastCommandId = 0;

  private readonly internalState: {
    queue: Queue;
    batchSendCommands: { [command: string]: any[][] };
  };

  private readonly sessionMarker: string = '';

  private get internalQueue(): Queue {
    return this.internalState.queue;
  }

  constructor(
    private readonly meta: (ISessionMeta & { sessionName: string }) | null,
    private readonly connection: ConnectionToCore,
    internalState?: CoreCommandQueue['internalState'],
  ) {
    if (meta) {
      const markers = [
        ''.padEnd(50, '-'),
        `------${meta.sessionName ?? ''}`.padEnd(50, '-'),
        `------${meta.sessionId ?? ''}`.padEnd(50, '-'),
        ''.padEnd(50, '-'),
      ].join('\n');
      this.sessionMarker = `\n\n${markers}`;
    }

    if (internalState) {
      this.internalState = internalState;
    } else {
      this.internalState = {
        queue: new Queue('CORE COMMANDS', 1),
        batchSendCommands: {},
      };
    }
  }

  public queueBatchedCommand(command: string, ...args: any[]): void {
    this.internalState.batchSendCommands[command] ??= [];
    this.internalState.batchSendCommands[command].push(args);
    if (this.internalState.batchSendCommands[command].length > 1000) this.flush().catch(() => null);
    this.internalQueue.enqueue(this.flush.bind(this));
  }

  public async flush(): Promise<void> {
    for (const [command, args] of Object.entries(this.internalState.batchSendCommands)) {
      delete this.internalState.batchSendCommands[command];
      if (!args) continue;
      await this.connection.sendRequest({
        meta: this.meta,
        command,
        args,
      });
    }
  }

  public run<T>(command: string, ...args: any[]): Promise<T> {
    if (this.connection.isDisconnecting) {
      return Promise.resolve(null);
    }
    for (const arg of args) {
      if (Array.isArray(arg)) {
        convertJsPathArgs(arg);
      }
    }
    return this.internalQueue
      .run<T>(async () => {
        const response = await this.connection.sendRequest({
          meta: this.meta,
          command,
          args,
        });

        let data: T = null;
        if (response) {
          this.lastCommandId = response.commandId;
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
    return new CoreCommandQueue(meta, this.connection, this.internalState);
  }
}
