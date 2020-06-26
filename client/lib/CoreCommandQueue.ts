import { createPromise } from '@secret-agent/commons/utils';
import ISessionMeta from '@secret-agent/core-interfaces/ISessionMeta';
import Log from '@secret-agent/commons/Logger';
import CoreClient from './CoreClient';

const { log } = Log(module);

export default class CoreCommandQueue {
  public type: 'queue' | 'heap' = 'queue';
  public items: IItem[] = [];
  public lastCommandId: number = 0;
  private isProcessing: boolean = false;

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
    });
    this.processQueue().catch(error => log.error(error));
    return promise;
  }

  // PRIVATE

  private async processQueue() {
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
}
