import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
export default class OutputTable extends SqliteTable<IOutputChangeRecord> {
    constructor(db: SqliteDatabase);
    insert(record: IOutputChangeRecord): void;
    all(): IOutputChangeRecord[];
}
export interface IOutputChangeRecord {
    type: string;
    path: string;
    value: string;
    lastCommandId: number;
    timestamp: number;
}
