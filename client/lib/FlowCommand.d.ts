import ISourceCodeLocation from '@ulixee/commons/interfaces/ISourceCodeLocation';
import IDomState from '@ulixee/hero-interfaces/IDomState';
import IFlowCommandOptions from '@ulixee/hero-interfaces/IFlowCommandOptions';
import CoreTab from './CoreTab';
import IFlowCommand from '../interfaces/IFlowCommand';
export default class FlowCommand<T = void> implements IFlowCommand {
    private readonly coreTab;
    private runCommandsFn;
    readonly id: number;
    readonly parent: FlowCommand;
    readonly callsitePath: ISourceCodeLocation[];
    readonly options?: IFlowCommandOptions;
    retryNumber: number;
    get isComplete(): Promise<boolean>;
    private get commandQueue();
    get parentId(): number;
    isRunning: boolean;
    isFlowStateChanged: boolean;
    private readonly exitHandler;
    private lastResult;
    constructor(coreTab: CoreTab, runCommandsFn: () => Promise<T>, exitState: IDomState, id: number, parent: FlowCommand, callsitePath: ISourceCodeLocation[], options?: IFlowCommandOptions);
    run(): Promise<T>;
    private clearCommandState;
    private setCommandState;
}
