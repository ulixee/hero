import { ILogEntry } from '@ulixee/commons/lib/Logger';
import ILog, { IBoundLog, ILogData } from '@ulixee/commons/interfaces/ILog';
export default class TestLogger implements ILog {
    readonly outPath: string;
    static testNumber: number;
    readonly level: string;
    readonly boundContext: any;
    private readonly module;
    constructor(outPath: string, module: NodeModule, boundContext?: any);
    stats(action: string, data?: ILogData): number;
    info(action: string, data?: ILogData): number;
    warn(action: string, data?: ILogData): number;
    error(action: string, data?: ILogData | {
        error: Error;
    }): number;
    flush(): void;
    createChild(module: any, boundContext?: any): ILog;
    protected log(level: ILogEntry['level'], action: string, data?: ILogData | any): number;
    static forTest(module: NodeModule): IBoundLog;
}
