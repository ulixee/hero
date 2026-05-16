import ICommandMeta from '@ulixee/hero-interfaces/ICommandMeta';
import { IJsPath } from '@ulixee/js-path';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import ICommandMarker from '@ulixee/unblocked-agent/interfaces/ICommandMarker';
import ICoreCommandRequestPayload from '@ulixee/hero-interfaces/ICoreCommandRequestPayload';
import { IRemoteEmitFn } from '../interfaces/IRemoteEventListener';
import SessionDb from '../dbs/SessionDb';
export type ICommandPresetMeta = Pick<ICoreCommandRequestPayload, 'startTime' | 'sendTime' | 'activeFlowHandlerId' | 'flowCommandId' | 'commandId' | 'callsite' | 'retryNumber'>;
export default class Commands extends TypedEventEmitter<{
    start: ICommandMeta;
    finish: ICommandMeta;
    pause: void;
    resume: void;
}> implements ICommandMarker {
    readonly db: SessionDb;
    get history(): ICommandMeta[];
    get last(): ICommandMeta | undefined;
    get lastId(): number;
    get length(): number;
    requiresScriptRestart: boolean;
    presetMeta: ICommandPresetMeta;
    private listenersById;
    private listenerIdCounter;
    private commandLockPromise;
    private defaultWaitForLocationCommandId;
    constructor(db: SessionDb);
    getStartingCommandIdFor(marker: 'waitForLocation'): number;
    waitForCommandLock(): Promise<void>;
    pause(): void;
    resume(): void;
    create(tabId: number, frameId: number, startNavigationId: number, commandName: string, args: any[], presetCommandMeta: ICommandPresetMeta): ICommandMeta;
    onStart(commandMeta: ICommandMeta, startDate: number): void;
    willRunCommand(newCommand: ICommandMeta): void;
    onFinished(commandMeta: ICommandMeta, result: any, endNavigationId: number): void;
    getCommandForTimestamp(lastCommand: ICommandMeta, timestamp: number): ICommandMeta;
    observeRemoteEvents(type: string, emitFn: IRemoteEmitFn, jsPath?: IJsPath, tabId?: number, frameId?: number): IRemoteListenerDetails;
    getRemoteEventListener(listenerId: string): IRemoteListenerDetails;
    private onRemoteEvent;
}
interface IRemoteListenerDetails {
    id: string;
    listenFn: (...eventArgs: any[]) => any;
    type: string;
    jsPath?: IJsPath;
}
export {};
