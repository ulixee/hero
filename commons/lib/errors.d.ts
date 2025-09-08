declare class UlixeeError extends Error {
    message: any;
    code: any;
    data?: object;
    constructor(message: any, code: any, data?: object);
    toJSON(): unknown;
    toString(): string;
}
/**
 * When this error is thrown it means an operation was aborted,
 * usually in response to the `abort` event being emitted by an
 * AbortSignal.
 */
declare class AbortError extends Error {
    static readonly code = "ABORT_ERR";
    readonly code: string;
    constructor(message?: string);
    toString(): string;
}
declare class CodeError<T extends Record<string, any> = Record<string, never>> extends Error {
    readonly code: string;
    readonly props: T;
    constructor(message: string, code: string, props?: T);
    toString(): string;
}
export { UlixeeError, CodeError, AbortError };
