import IResolvablePromise from '../interfaces/IResolvablePromise';
export default class Resolvable<T = any> implements IResolvablePromise<T>, PromiseLike<T> {
    id: number;
    isResolved: boolean;
    resolved: T;
    promise: Promise<T>;
    readonly timeout: NodeJS.Timeout;
    readonly stack: string;
    private resolveFn;
    private rejectFn;
    constructor(timeoutMillis?: number, timeoutMessage?: string);
    resolve(value: T | PromiseLike<T>): void;
    reject(error: Error, noUnhandledRejections?: boolean): void;
    toJSON(): object;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: (value: T) => TResult1 | PromiseLike<TResult1>, onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>): Promise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: (reason: any) => TResult | PromiseLike<TResult>): Promise<T | TResult>;
    finally(onfinally?: () => void): Promise<T>;
    private clean;
    private rejectWithTimeout;
}
