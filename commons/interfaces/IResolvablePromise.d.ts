export default interface IResolvablePromise<T = any> extends PromiseLike<T> {
    isResolved: boolean;
    resolved: T;
    stack?: string;
    promise?: Promise<T>;
    resolve?: (value?: T | PromiseLike<T>) => void;
    reject?: (reason?: any, noUnhandledRejections?: boolean) => void;
    timeout?: NodeJS.Timeout;
}
