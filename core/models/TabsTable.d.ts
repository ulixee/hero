import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import IViewport from '@ulixee/unblocked-specification/agent/browser/IViewport';
export default class TabsTable extends SqliteTable<ITabsRecord> {
    constructor(db: SqliteDatabase);
    insert(tabId: number, pageId: string, devtoolsSessionId: string, viewPort: IViewport, parentTabId?: number): void;
}
export interface ITabsRecord {
    id: number;
    parentId: number | null;
    pageTargetId: string;
    devtoolsSessionId: string;
    viewportWidth: number;
    viewportHeight: number;
    browserPositionX: number;
    browserPositionY: number;
    createdTime: number;
}
