import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
export default class AwaitedEventsTable extends SqliteTable<IEventRecord> {
    private idCounter;
    constructor(db: SqliteDatabase);
    insert(eventRecord: Omit<IEventRecord, 'id'>): void;
}
export interface IEventRecord {
    id: number;
    tabId: number;
    frameId: number;
    listenerId: string;
    eventArgs: any;
    timestamp: number;
    publishedAtCommandId: number;
}
