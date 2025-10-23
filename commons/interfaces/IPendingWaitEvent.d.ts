import IResolvablePromise from './IResolvablePromise';
export declare class CanceledPromiseError extends Error {
    constructor(message: string);
}
export default interface IPendingWaitEvent {
    id: number;
    event: string | symbol;
    resolvable: IResolvablePromise;
    error: CanceledPromiseError;
}
