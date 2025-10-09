import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import IDetachedElement from '@ulixee/hero-interfaces/IDetachedElement';
export default class DetachedElementsTable extends SqliteTable<IDetachedElement & {
    id?: number;
}> {
    private idCounter;
    constructor(db: SqliteDatabase);
    insert(detachedElement: IDetachedElement): void;
    getByName(name: string): IDetachedElement[];
    allNames(): string[];
    updateHtml(element: IDetachedElement): void;
}
