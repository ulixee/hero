import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import { IWebsocketMessage } from '@ulixee/unblocked-agent/lib/WebsocketMessages';
export default class WebsocketMessagesTable extends SqliteTable<IWebsocketMessageRecord> {
    constructor(db: SqliteDatabase);
    getMessages(resourceId: number): IWebsocketMessageRecord[];
    getTranslatedMessages(resourceId: number): IWebsocketMessage[];
    insert(lastCommandId: number, resourceMessage: IWebsocketMessage): void;
}
export interface IWebsocketMessageRecord {
    id: number;
    resourceId: number;
    message: Buffer;
    isBinary: boolean;
    isFromServer: boolean;
    timestamp: number;
    receivedAtCommandId: number;
    seenAtCommandId: number;
}
