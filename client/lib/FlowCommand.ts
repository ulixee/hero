import CoreTab from './CoreTab';
import DomStateHandler from './DomStateHandler';
import IFlowCommand from '../interfaces/IFlowCommand';
import CoreCommandQueue from './CoreCommandQueue';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import ISourceCodeLocation from '@ulixee/commons/interfaces/ISourceCodeLocation';
import IDomState from '@ulixee/hero-interfaces/IDomState';
import IFlowCommandOptions from '@ulixee/hero-interfaces/IFlowCommandOptions';

export default class FlowCommand implements IFlowCommand {
  public retryNumber = 0;

  public get isComplete(): Promise<boolean> {
    if (this.exitHandler) {
      return this.exitHandler.check();
    }
    return Promise.resolve(true);
  }

  private get commandQueue(): CoreCommandQueue {
    return this.coreTab.commandQueue;
  }

  public get parentId(): number {
    return this.parent?.id;
  }

  public isRunning = false;
  public isFlowStateChanged = false;

  private readonly exitHandler: DomStateHandler;

  constructor(
    private readonly coreTab: CoreTab,
    private runCommandsFn: () => Promise<void>,
    exitState: IDomState,
    readonly id: number,
    readonly parent: FlowCommand,
    readonly callsitePath: ISourceCodeLocation[],
    readonly options?: IFlowCommandOptions,
  ) {
    this.options ??= { maxRetries: CoreCommandQueue.maxCommandRetries };
    if (exitState) {
      this.exitHandler = new DomStateHandler(exitState, null, coreTab, this.callsitePath, {
        flowCommand: this,
      });
    }
  }

  async run(): Promise<void> {
    // if we have previously tried this and it's still valid, break out
    if (this.retryNumber > 0 && !!this.exitHandler && (await this.isComplete)) return;

    // Retry until isComplete is satisfied, or we have retried a max number of times
    for (let count = 0; count < this.options.maxRetries; count += 1) {
      try {
        this.isRunning = true;
        this.isFlowStateChanged = false; // clear out any flow state changes
        this.retryNumber += count; // add to retry count because we might be nested
        this.setCommandState();
        await this.runCommandsFn();

        if (await this.isComplete) return;

        if (this.isFlowStateChanged) continue;
        // if not complete, trigger flow handlers to retry (catch will trigger on its own)
        const shouldRetry = await this.coreTab.triggerFlowHandlers();

        if (!shouldRetry) {
          throw new Error(
            'The FlowCommand cannot be completed. The Exit State is not satisfied and no FlowHandlers were triggered.',
          );
        }
      } catch (error) {
        if (error instanceof CanceledPromiseError) throw error;

        const shouldRetry = await this.coreTab.shouldRetryFlowHandlers(
          this.commandQueue.retryingCommand,
          error,
        );
        if (!shouldRetry && !this.isFlowStateChanged) throw error;
      } finally {
        this.clearCommandState();
        this.isRunning = false;
      }
    }
  }

  private clearCommandState(): void {
    if (this.parent) {
      this.parent.setCommandState();
      return;
    }
    this.commandQueue.shouldRetryCommands = true;
    this.commandQueue.setCommandMetadata({ flowCommandId: undefined, retryNumber: undefined });
  }

  private setCommandState(): void {
    this.commandQueue.shouldRetryCommands = false;
    this.commandQueue.setCommandMetadata({ flowCommandId: this.id, retryNumber: this.retryNumber });
  }
}
