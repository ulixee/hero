import { createPromise } from '@secret-agent/commons/utils';
import ISessionMeta from '@secret-agent/core-interfaces/ISessionMeta';
import Log from '@secret-agent/commons/Logger';
import CoreClient from './CoreClient';

const { log } = Log(module);

export default class CoreCommandQueue {
  public type: 'queue' | 'heap' = 'queue';
  public items: IItem[] = [];
  public lastCommandId = 0;
  private isProcessing = false;

  constructor(
    private readonly meta: ISessionMeta | null,
    private readonly coreClient: CoreClient,
    parentCommandQueue?: CoreCommandQueue,
  ) {
    if (parentCommandQueue) {
      this.type = parentCommandQueue.type;
    }
  }

  public async run<T>(command: string, ...args: any[]): Promise<T> {
    const { resolve, reject, promise } = createPromise<T>();
    this.items.push({
      resolve,
      reject,
      command,
      meta: this.meta,
      args,
      stack: new Error().stack.replace('Error:', ''),
    });
    this.processQueue().catch(error =>
      log.error('CommandRunError', { error, sessionId: this.meta?.sessionId }),
    );
    return promise;
  }

  public clearPending(): void {
    this.items.length = 0;
  }

  // PRIVATE

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;
    try {
      while (this.items.length) {
        const item: IItem = this.items.shift();
        try {
          const response = await this.coreClient.pipeOutgoingCommand(
            item.meta,
            item.command,
            item.args,
          );
          let data = null;
          if (response) {
            this.lastCommandId = response.commandId;
            data = response.data;
          }
          item.resolve(data);
        } catch (error) {
          error.stack += `\n-----CORE-----${item.stack}`;
          item.reject(error);
        }
        // force next loop so promises don't simulate synchronous-ity when local core
        await new Promise(setImmediate);
      }
    } finally {
      this.isProcessing = false;
    }
  }
}

interface IItem {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  command: string;
  meta: ISessionMeta | null;
  args: any[];
  stack: string;
}
