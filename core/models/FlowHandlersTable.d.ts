import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
export default class FlowHandlersTable extends SqliteTable<IFlowHandlerRecord> {
    constructor(db: SqliteDatabase);
    insert(handler: IFlowHandlerRecord): void;
}
export interface IFlowHandlerRecord {
    id: number;
    tabId: number;
    name?: string;
    callsite: string;
}
