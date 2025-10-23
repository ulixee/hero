import { Database as SqliteDatabase } from 'better-sqlite3';
import INavigation from '@ulixee/unblocked-specification/agent/browser/INavigation';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
export default class FrameNavigationsTable extends SqliteTable<IFrameNavigationRecord> {
    idCounter: number;
    private allNavigationsById;
    constructor(db: SqliteDatabase);
    getAllNavigations(): INavigation[];
    get(id: number): INavigation;
    insert(navigation: INavigation): void;
    last(): IFrameNavigationRecord;
    getById(id: number): IFrameNavigationRecord;
    getMostRecentTabNavigations(tabId: number, frameIds?: Set<number>): IFrameNavigationRecord[];
    static toNavigation(record: IFrameNavigationRecord, recreateResolvable?: boolean): INavigation;
}
export interface IFrameNavigationRecord {
    id: number;
    documentNavigationId: number;
    frameId: number;
    tabId: number;
    doctype: string;
    resourceId?: number;
    requestedUrl: string;
    finalUrl?: string;
    loaderId: string;
    startCommandId: number;
    navigationReason: string;
    initiatedTime: number;
    httpRequestedTime: number;
    httpRespondedTime: number;
    httpRedirectedTime?: number;
    javascriptReadyTime?: number;
    domContentLoadedTime?: number;
    loadTime?: number;
    contentPaintedTime?: number;
}
