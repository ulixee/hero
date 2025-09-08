import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import { FocusEventType, IFocusEvent } from '@ulixee/hero-interfaces/IFocusEvent';
export default class FocusEventsTable extends SqliteTable<IFocusRecord> {
    constructor(db: SqliteDatabase);
    insert(tabId: number, frameId: number, commandId: number, focusEvent: IFocusEvent): IFocusRecord;
}
export interface IFocusRecord {
    tabId: number;
    frameId: number;
    event: FocusEventType;
    targetNodeId?: number;
    relatedTargetNodeId?: number;
    timestamp: number;
}
