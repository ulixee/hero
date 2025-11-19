import IDomStateResult from '@ulixee/hero-interfaces/IDomStateResult';
import IDomStateListenArgs from '@ulixee/hero-interfaces/IDomStateListenArgs';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import IDomStateAssertionBatch from '@ulixee/hero-interfaces/IDomStateAssertionBatch';
import Tab from './Tab';
export interface IDomStateEvents {
    resolved: {
        didMatch: boolean;
        error?: Error;
    };
    updated: IDomStateResult;
}
export default class DomStateListener extends TypedEventEmitter<IDomStateEvents> {
    readonly jsPathId: string;
    private readonly options;
    private readonly tab;
    readonly id: string;
    readonly name: string;
    readonly url: string | RegExp;
    readonly startTime: number;
    readonly startingCommandId: number;
    readonly commandStartTime: number;
    get hasCommands(): boolean;
    readonly rawBatchAssertionsById: Map<string, IDomStateAssertionBatch>;
    private batchAssertionsById;
    private commandFnsById;
    private readonly checkInterval;
    private lastResults;
    private isStopping;
    private isCheckingState;
    private runAgainTime;
    private watchedFrameIds;
    private events;
    private readonly logger;
    constructor(jsPathId: string, options: IDomStateListenArgs, tab: Tab);
    stop(result?: {
        didMatch: boolean;
        error?: Error;
    }): void;
    runBatchAssert(batchId: string): Promise<boolean>;
    addAssertionBatch(batch: IDomStateAssertionBatch): string;
    private bindFrameEvents;
    private trackCommand;
    private publishResult;
    private validateState;
    private shouldStop;
}
