import ICommandMeta from '@ulixee/hero-interfaces/ICommandMeta';
import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
export default class CommandsTable extends SqliteTable<ICommandMeta> {
    history: ICommandMeta[];
    get last(): ICommandMeta | undefined;
    get lastId(): number;
    private historyById;
    constructor(db: SqliteDatabase);
    loadHistory(): ICommandMeta[];
    insert(commandMeta: ICommandMeta): void;
}
