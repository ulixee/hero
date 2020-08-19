import BaseTable from '../lib/BaseTable';
import { Database as SqliteDatabase } from 'better-sqlite3';

export default class PageLogsTable extends BaseTable<IPageLogRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(db, 'PageLogs', [
      ['frameId', 'TEXT'],
      ['type', 'TEXT'],
      ['message', 'TEXT'],
      ['timestamp', 'TEXT'],
      ['location', 'TEXT'],
    ]);
  }

  public insert(frameId: string, type: string, message: string, date: Date, location?: string) {
    return this.queuePendingInsert([frameId, type, message, date.toISOString(), location]);
  }
}

export interface IPageLogRecord {
  frameId: string;
  type: string;
  message: string;
  timestamp: string;
  location?: string;
}
