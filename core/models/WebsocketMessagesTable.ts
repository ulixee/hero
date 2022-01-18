import { Database as SqliteDatabase } from 'better-sqlite3';
import IWebsocketResourceMessage from '@ulixee/hero-interfaces/IWebsocketResourceMessage';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';

export default class WebsocketMessagesTable extends SqliteTable<IWebsocketMessageRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(db, 'WebsocketMessages', [
      ['id', 'INTEGER', 'NOT NULL PRIMARY KEY'],
      ['resourceId', 'INTEGER'],
      ['message', 'BLOB'],
      ['isBinary', 'INTEGER'],
      ['isFromServer', 'INTEGER'],
      ['receivedAtCommandId', 'INTEGER'],
      ['seenAtCommandId', 'INTEGER'],
    ]);
  }

  public getMessages(resourceId: number): IWebsocketMessageRecord[] {
    return this.db.prepare(`select * from ${this.tableName} where resourceId=?`).all(resourceId);
  }

  public insert(lastCommandId: number, resourceMessage: IWebsocketResourceMessage): void {
    return this.queuePendingInsert([
      resourceMessage.messageId,
      resourceMessage.resourceId,
      Buffer.from(resourceMessage.message),
      typeof resourceMessage.message !== 'string' ? 1 : 0,
      resourceMessage.source === 'server' ? 1 : 0,
      lastCommandId,
      undefined,
    ]);
  }
}

export interface IWebsocketMessageRecord {
  id: number;
  resourceId: number;
  message: Buffer;
  isBinary: boolean;
  isFromServer: boolean;
  receivedAtCommandId: number;
  seenAtCommandId: number;
}
