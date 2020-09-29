import { Database as SqliteDatabase } from 'better-sqlite3';
import BaseTable from '../lib/BaseTable';

export default class PageLogsTable extends BaseTable<IPageLogRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(db, 'PageLogs', [
      ['tabId', 'TEXT'],
      ['frameId', 'TEXT'],
      ['type', 'TEXT'],
      ['message', 'TEXT'],
      ['timestamp', 'TEXT'],
      ['location', 'TEXT'],
    ]);
  }

  public insert(
    tabId: string,
    frameId: string,
    type: string,
    message: string,
    date: Date,
    location?: string,
  ) {
    return this.queuePendingInsert([tabId, frameId, type, message, date.toISOString(), location]);
  }
}

export interface IPageLogRecord {
  tabId: string;
  frameId: string;
  type: string;
  message: string;
  timestamp: string;
  location?: string;
}
