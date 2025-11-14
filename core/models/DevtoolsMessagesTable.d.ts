import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import DevtoolsSessionLogger from '@ulixee/unblocked-agent/lib/DevtoolsSessionLogger';
export default class DevtoolsMessagesTable extends SqliteTable<IDevtoolsMessageRecord> {
    private pageIds;
    private workerIds;
    private frameIds;
    private requestIds;
    constructor(db: SqliteDatabase);
    insert(event: DevtoolsSessionLogger['EventTypes']['devtools-message']): void;
}
export interface IDevtoolsMessageRecord {
    send: boolean;
    pageNumber?: number;
    workerNumber?: number;
    frameNumber?: number;
    requestNumber?: string;
    isBrowserSession: boolean;
    method?: string;
    id?: number;
    params?: string;
    error?: string;
    result?: string;
    timestamp: number;
}
