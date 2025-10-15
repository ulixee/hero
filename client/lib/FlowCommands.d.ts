import ISourceCodeLocation from '@ulixee/commons/interfaces/ISourceCodeLocation';
import IDomState from '@ulixee/hero-interfaces/IDomState';
import IFlowCommandOptions from '@ulixee/hero-interfaces/IFlowCommandOptions';
import CoreTab from './CoreTab';
import FlowCommand from './FlowCommand';
export default class FlowCommands {
    private readonly coreTab;
    private readonly flowCommands;
    get runningFlowCommand(): FlowCommand;
    get isRunning(): boolean;
    constructor(coreTab: CoreTab);
    create<T>(commandFn: () => Promise<T>, exitState: IDomState, callsitePath: ISourceCodeLocation[], options: IFlowCommandOptions): Promise<FlowCommand<T>>;
    didRunFlowHandlers(): void;
}
