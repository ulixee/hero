import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
export default class FlowCommandsTable extends SqliteTable<IFlowCommandsRecord> {
    constructor(db: SqliteDatabase);
    insert(handler: IFlowCommandsRecord): void;
}
export interface IFlowCommandsRecord {
    id: number;
    parentId: number;
    tabId: number;
    callsite: string;
}
