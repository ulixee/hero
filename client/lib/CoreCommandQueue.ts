import ISessionMeta from '@secret-agent/core-interfaces/ISessionMeta';
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
    this.internalQueue = new Queue('CORE COMMANDS');
    this.internalQueue.concurrency = 1;
  }

  public run<T>(command: string, ...args: any[]): Promise<T> {
    return this.internalQueue.run<T>(this.runRequest.bind(this, command, args)).catch(error => {
      error.stack += `${this.sessionMarker}`;
      throw error;
    });
  }

  public stop(cancelError: CanceledPromiseError): void {
    this.internalQueue.stop(cancelError);
  }

  private async runRequest<T>(command: string, args: any[]): Promise<T> {
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
  }
}
