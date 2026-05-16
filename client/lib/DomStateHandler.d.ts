import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import ISourceCodeLocation from '@ulixee/commons/interfaces/ISourceCodeLocation';
import IDomState from '@ulixee/hero-interfaces/IDomState';
import IFlowCommand from '../interfaces/IFlowCommand';
import CoreTab from './CoreTab';
export default class DomStateHandler {
    #private;
    readonly domState: IDomState;
    readonly name: string;
    constructor(domState: IDomState, name: string, coreTab: CoreTab, callsitePath: ISourceCodeLocation[], scope?: {
        flowCommand?: IFlowCommand;
        flowHandlerId?: number;
    });
    cancel(cancelPromise: CanceledPromiseError): Promise<void>;
    register(onMatchFn: (error: Error, didMatch?: boolean) => any, onlyRunCallbackOnMatch?: boolean): Promise<void>;
    clear(result: boolean, error?: Error): Promise<void>;
    check(isRetry?: boolean): Promise<boolean>;
    waitFor(timeoutMs?: number, once?: boolean): Promise<boolean>;
    private onStateChanged;
    private isAssertionValid;
    private createAssertionSets;
    private collectAssertionCommands;
    private getCommandId;
}
