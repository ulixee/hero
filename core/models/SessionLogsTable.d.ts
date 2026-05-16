import { Database as SqliteDatabase } from 'better-sqlite3';
import { ILogEntry } from '@ulixee/commons/lib/Logger';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
export default class SessionLogsTable extends SqliteTable<ISessionLogRecord> {
    constructor(db: SqliteDatabase);
    insert(log: ILogEntry): void;
    allErrors(): ISessionLogRecord[];
}
export interface ISessionLogRecord {
    id: number;
    timestamp: number;
    action: string;
    level: string;
    module: string;
    isGlobal?: boolean;
    parentId?: number;
    data?: any;
}
