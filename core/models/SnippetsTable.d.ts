import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import IDataSnippet from '@ulixee/hero-interfaces/IDataSnippet';
export default class SnippetsTable extends SqliteTable<IDataSnippet> {
    constructor(db: SqliteDatabase);
    getByName(name: string): IDataSnippet[];
    insert(name: string, value: any, timestamp: number, commandId: number): IDataSnippet;
}
