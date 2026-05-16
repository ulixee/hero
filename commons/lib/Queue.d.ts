import { CanceledPromiseError } from '../interfaces/IPendingWaitEvent';
import IResolvablePromise from '../interfaces/IResolvablePromise';
import TypedEventEmitter from './TypedEventEmitter';
type AsyncCallback<T> = (value?: any) => Promise<T>;
export default class Queue<TResult = any> extends TypedEventEmitter<{
    'run-completed': TResult;
    'run-error': Error;
    idle: void;
    stopped: {
        error?: Error;
    };
}> {
    readonly stacktraceMarker: string;
    concurrency: number;
    idletimeMillis: number;
    idlePromise: IResolvablePromise<any>;
    get isActive(): boolean;
    get size(): number;
    activeCount: number;
    private abortPromise;
    private idleTimout;
    private stopDequeuing;
    private queue;
    constructor(stacktraceMarker?: string, concurrency?: number, abortSignal?: AbortSignal);
    run<T>(cb: AsyncCallback<T>, options?: {
        timeoutMillis?: number;
        priority?: number | bigint;
    }): Promise<T>;
    reset(): void;
    willStop(): void;
    stop(error?: CanceledPromiseError): void;
    canRunMoreConcurrently(): boolean;
    toGenerator(events?: TypedEventEmitter<{
        cleanup: void;
    }>): AsyncGenerator<TResult, void, undefined>;
    private next;
    private reject;
    private getInsertionIndex;
}
export {};
