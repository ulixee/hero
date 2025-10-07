import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import { IScrollEvent } from '@ulixee/hero-interfaces/IScrollEvent';
export default class ScrollEventsTable extends SqliteTable<IScrollRecord> {
    constructor(db: SqliteDatabase);
    insert(tabId: number, frameId: number, commandId: number, scrollEvent: IScrollEvent): IScrollRecord;
}
export interface IScrollRecord {
    tabId: number;
    frameId: number;
    scrollX: number;
    scrollY: number;
    commandId: number;
    timestamp: number;
}
