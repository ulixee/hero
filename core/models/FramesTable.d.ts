import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
export default class FramesTable extends SqliteTable<IFrameRecord> {
    #private;
    frameDomNodePathsById: {
        [frameId: number]: string;
    };
    framesById: {
        [frameId: number]: {
            parentId: number;
            domNodeId: number;
        };
    };
    constructor(db: SqliteDatabase);
    insert(frame: IFrameRecord): void;
    mainFrameIds(tabId?: number): Set<number>;
    all(): IFrameRecord[];
    private recordDomNodePath;
}
export interface IFrameRecord {
    id: number;
    tabId: number;
    parentId?: number;
    domNodeId?: number;
    startCommandId: number;
    name?: string;
    securityOrigin?: string;
    devtoolsFrameId: string;
    createdTimestamp: number;
}
