import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import { IDomStorageEvents } from '@ulixee/unblocked-agent/lib/DomStorageTracker';
export default class StorageChangesTable extends SqliteTable<IStorageChangesEntry> {
    private changesByTabIdAndTime;
    private hasLoadedCounts;
    constructor(db: SqliteDatabase);
    insert(tabId: number, frameId: number, entry: IDomStorageEvents['dom-storage-updated'] & {
        type: IStorageChangesEntry['type'];
    }): void;
    findChange(tabId: number, filter: Omit<IStorageChangesEntry, 'tabId' | 'timestamp' | 'value' | 'meta'>): IStorageChangesEntry;
    withTimeInRange(tabId: number, startTime: number, endTime: number): IStorageChangesEntry[];
    getChangesByTabIdAndTime(): {
        tabId: number;
        timestamp: number;
        count: number;
    }[];
    private trackChangeTime;
}
export interface IStorageChangesEntry {
    type: 'cookie' | IDomStorageEvents['dom-storage-updated']['type'];
    action: IDomStorageEvents['dom-storage-updated']['action'];
    securityOrigin: string;
    tabId: number;
    timestamp: number;
    key: string;
    value: string;
    meta: string;
}
