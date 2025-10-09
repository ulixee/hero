export declare function createPromise<T = any>(timeoutMillis?: number, timeoutMessage?: string): IResolvablePromise<T>;
export interface IResolvablePromise<T = any> {
    isResolved: boolean;
    promise?: Promise<T>;
    resolve?: (value?: T | PromiseLike<T>) => void;
    reject?: (reason?: any) => void;
    timeout?: NodeJS.Timeout;
}
