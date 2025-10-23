export default class Timer {
    readonly timeoutMillis: number;
    readonly registry?: IRegistry[];
    readonly [Symbol.toStringTag] = "Timer";
    readonly timeout: NodeJS.Timeout;
    private readonly time;
    private timeoutMessage;
    private readonly expirePromise;
    constructor(timeoutMillis: number, registry?: IRegistry[]);
    setMessage(message: string): void;
    clear(): void;
    throwIfExpired(message?: string): void;
    isExpired(): boolean;
    isResolved(): boolean;
    elapsedMillis(): number;
    waitForPromise<Z>(promise: Promise<Z>, message: string): Promise<Z>;
    waitForTimeout(): Promise<void>;
    private expire;
    static expireAll(registry: IRegistry[], error: Error): void;
}
interface IRegistry {
    timeout: NodeJS.Timeout;
    reject: (err: Error, noUnhandledRejections?: boolean) => any;
}
export {};
