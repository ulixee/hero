import ISessionMeta from '@secret-agent/interfaces/ISessionMeta';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import Queue from '@secret-agent/commons/Queue';
import ConnectionToCore from '../connections/ConnectionToCore';

export default class CoreCommandQueue {
  public lastCommandId = 0;

  private readonly internalQueue: Queue;
  private readonly sessionMarker: string = '';

  constructor(
    private readonly meta: (ISessionMeta & { sessionName: string }) | null,
    private readonly connection: ConnectionToCore,
    sharedQueue?: Queue,
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

    this.internalQueue = sharedQueue ?? new Queue('CORE COMMANDS');
    this.internalQueue.concurrency = 1;
  }

  public run<T>(command: string, ...args: any[]): Promise<T> {
    if (this.connection.isDisconnecting) {
      return Promise.resolve(null);
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
    return new CoreCommandQueue(meta, this.connection, this.internalQueue);
  }
}
