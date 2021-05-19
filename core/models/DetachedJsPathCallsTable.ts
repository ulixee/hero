import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@secret-agent/commons/SqliteTable';
import { IJsPathHistory } from '../lib/JsPath';

export default class DetachedJsPathCallsTable extends SqliteTable<IDetachedJsPathCallsRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(db, 'DetachedJsPathCalls', [
      ['callsitePath', 'TEXT'],
      ['execJsPathHistory', 'TEXT'],
      ['timestamp', 'INTEGER'],
    ]);
  }

  public insert(callsitePath: string, execJsPathHistory: IJsPathHistory[], timestamp: Date) {
    const record = [
      callsitePath,
      JSON.stringify(execJsPathHistory),
      new Date(timestamp).toISOString(),
    ];
    this.insertNow(record);
  }

  public find(callsite: string): IDetachedJsPathCallsRecord {
    try {
      return this.db
        .prepare(`select * from ${this.tableName} where callsitePath=? limit 1`)
        .get(callsite);
    } catch (err) {
      if (String(err).includes('no such table')) return;
      throw err;
    }
  }
}

export interface IDetachedJsPathCallsRecord {
  callsitePath: string;
  execJsPathHistory: string;
  timestamp: number;
}
