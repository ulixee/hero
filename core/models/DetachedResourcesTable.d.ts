import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
export default class DetachedResourcesTable extends SqliteTable<IDetachedResourcesRecord> {
    constructor(db: SqliteDatabase);
    getByName(name: string): IDetachedResourcesRecord[];
    insert(tabId: number, resourceId: number, name: string, timestamp: number, commandId: number): void;
}
export interface IDetachedResourcesRecord {
    name: string;
    resourceId: number;
    tabId: number;
    timestamp: number;
    commandId: number;
}
