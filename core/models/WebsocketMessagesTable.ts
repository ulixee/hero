import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import { IWebsocketMessage } from '@unblocked-web/agent/lib/WebsocketMessages';

export default class WebsocketMessagesTable extends SqliteTable<IWebsocketMessageRecord> {
  constructor(db: SqliteDatabase) {
    super(db, 'WebsocketMessages', [
      ['id', 'INTEGER', 'NOT NULL PRIMARY KEY'],
      ['resourceId', 'INTEGER'],
      ['message', 'BLOB'],
      ['isBinary', 'INTEGER'],
      ['isFromServer', 'INTEGER'],
      ['timestamp', 'DATETIME'],
      ['receivedAtCommandId', 'INTEGER'],
      ['seenAtCommandId', 'INTEGER'],
    ]);
  }

  public getMessages(resourceId: number): IWebsocketMessageRecord[] {
    return this.db.prepare(`select * from ${this.tableName} where resourceId=?`).all(resourceId);
  }

  public getTranslatedMessages(resourceId: number): IWebsocketMessage[] {
    return this.getMessages(resourceId).map(message => {
      return {
        message: message.isBinary ? message.message : message.message.toString(),
        source: message.isFromServer ? 'server' : 'client',
        timestamp: message.timestamp,
        messageId: message.id,
        resourceId: message.resourceId,
      };
    });
  }

  public insert(lastCommandId: number, resourceMessage: IWebsocketMessage): void {
    return this.queuePendingInsert([
      resourceMessage.messageId,
      resourceMessage.resourceId,
      Buffer.from(resourceMessage.message),
      typeof resourceMessage.message !== 'string' ? 1 : 0,
      resourceMessage.source === 'server' ? 1 : 0,
      resourceMessage.timestamp,
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
  timestamp: number;
  receivedAtCommandId: number;
  seenAtCommandId: number;
}
