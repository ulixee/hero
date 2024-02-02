import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
export default class PageLogsTable extends SqliteTable<IPageLogRecord> {
    constructor(db: SqliteDatabase);
    insert(tabId: number, frameId: number, type: string, message: string, date: Date, location?: string): void;
}
export interface IPageLogRecord {
    tabId: number;
    frameId: number;
    type: string;
    message: string;
    timestamp: number;
    location?: string;
}
