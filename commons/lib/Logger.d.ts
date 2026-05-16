import ILog, { ILogData } from '../interfaces/ILog';
declare global {
    function UlixeeLogCreator(module: NodeModule): {
        log: ILog;
    };
    var UlxLogPrototype: Log;
    var UlxLogFilters: any;
    var UlxLoggerSessionIdNames: Map<string, string>;
    var UlxSubscriptions: Map<number, (log: ILogEntry) => any>;
}
declare const hasBeenLoggedSymbol: unique symbol;
declare class Log implements ILog {
    readonly level: LogLevel;
    useColors: boolean;
    readonly boundContext: any;
    private readonly module;
    private logtimeById;
    constructor(module: NodeModule, boundContext?: any);
    stats(action: string, data?: ILogData): number;
    info(action: string, data?: ILogData): number;
    warn(action: string, data?: ILogData): number;
    error(action: string, data?: ILogData | {
        error: Error;
    }): number;
    createChild(module: any, boundContext?: any): ILog;
    flush(): void;
    protected logToConsole(level: LogLevel, entry: ILogEntry): void;
    private log;
}
export declare function translateToPrintable(data: any, result?: {
    error?: Error;
    printData: any;
}): {
    error?: Error;
    printData: any;
};
declare const logLevels: {
    stats: number;
    info: number;
    warn: number;
    error: number;
};
export default function logger(module: NodeModule): ILogBuilder;
declare const loggerSessionIdNames: Map<string, string>;
declare class LogEvents {
    static unsubscribe(subscriptionId: number): void;
    static subscribe(onLogFn: (log: ILogEntry) => any): number;
    static broadcast(entry: ILogEntry): void;
}
export { Log, LogEvents, loggerSessionIdNames, hasBeenLoggedSymbol };
export declare function injectLogger(builder: (module: NodeModule) => ILogBuilder): void;
export interface ILogEntry {
    id: number;
    timestamp: Date;
    action: string;
    module: string;
    sessionId?: string;
    parentId?: number;
    data?: any;
    level: LogLevel;
    millis?: number;
}
type LogLevel = keyof typeof logLevels;
interface ILogBuilder {
    log: ILog;
}
export declare function registerNamespaceMapping(filter?: string): void;
