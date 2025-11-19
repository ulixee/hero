type ShutdownSignal = NodeJS.Signals | 'exit';
export default class ShutdownHandler {
    static exitOnSignal: boolean;
    static disableSignals: boolean;
    private static isRegistered;
    private static hasRunHandlers;
    private static readonly onShutdownFns;
    static register(onShutdownFn: (signal?: ShutdownSignal) => Promise<any> | any, runWithDisabledSignals?: boolean): void;
    static unregister(onShutdownFn: (signal?: ShutdownSignal) => Promise<any> | any): void;
    static run(): Promise<void>;
    static registerSignals(): void;
    private static onSignal;
}
export {};
