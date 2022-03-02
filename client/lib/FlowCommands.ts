import FlowCommand from './FlowCommand';
import CoreTab from './CoreTab';
import ISourceCodeLocation from '@ulixee/commons/interfaces/ISourceCodeLocation';
import IDomState from '@ulixee/hero-interfaces/IDomState';
import IFlowCommandOptions from '@ulixee/hero-interfaces/IFlowCommandOptions';

export default class FlowCommands {
  private readonly flowCommands: FlowCommand<any>[] = [];

  public get runningFlowCommand(): FlowCommand {
    return this.flowCommands.find(x => x.isRunning);
  }

  public get isRunning(): boolean {
    return this.flowCommands.some(x => x.isRunning);
  }

  constructor(private readonly coreTab: CoreTab) {}

  public async create<T>(
    commandFn: () => Promise<T>,
    exitState: IDomState,
    callsitePath: ISourceCodeLocation[],
    options: IFlowCommandOptions,
  ): Promise<FlowCommand<T>> {
    const id = this.flowCommands.length + 1;
    const parentFlow = this.runningFlowCommand;

    let flowCommand: FlowCommand<T>;
    if (parentFlow && parentFlow.retryNumber > 0) {
      const callsiteJson = JSON.stringify(callsitePath);
      flowCommand = this.flowCommands.find(
        x => x.parentId === parentFlow.id && callsiteJson === JSON.stringify(x.callsitePath),
      ) as any;
      flowCommand.retryNumber += 1;
      return flowCommand;
    } else {
      flowCommand = new FlowCommand(
        this.coreTab,
        commandFn,
        exitState,
        id,
        parentFlow,
        callsitePath,
        options,
      );
      this.flowCommands.push(flowCommand);
      await this.coreTab.commandQueue.runOutOfBand(
        'Tab.registerFlowCommand',
        flowCommand.id,
        flowCommand.parentId,
        callsitePath,
      );
    }

    return flowCommand;
  }

  public didRunFlowHandlers(): void {
    for (const flowCommand of this.flowCommands) {
      if (flowCommand.isRunning) flowCommand.isFlowStateChanged = true;
    }
  }
}
