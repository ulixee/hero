export default interface ILog extends IBoundLog<ILogData> {
    level?: string;
    flush?(): any;
}
export interface IBoundLog<Base = any> {
    boundContext: any;
    stats<T extends Base>(action: string, data?: T): number;
    info<T extends Base>(action: string, data?: T): number;
    warn<T extends Base>(action: string, data?: T): number;
    error<T extends Base>(action: string, data?: T | {
        error: Error;
    }): number;
    createChild(module: any, boundData?: any): IBoundLog;
}
export interface ILogData {
    sessionId: string;
    parentLogId?: number;
}
