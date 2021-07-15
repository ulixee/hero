import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/SqliteTable';

export default class OutputTable extends SqliteTable<IOutputChangeRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(
      db,
      'Output',
      [
        ['type', 'TEXT'],
        ['path', 'TEXT'],
        ['value', 'TEXT'],
        ['lastCommandId', 'INTEGER'],
        ['timestamp', 'INTEGER'],
      ],
      true,
    );
  }

  public insert(record: IOutputChangeRecord) {
    const { type, path, value, lastCommandId, timestamp } = record;
    return this.queuePendingInsert([
      type,
      path,
      JSON.stringify(value),
      lastCommandId,
      timestamp.getTime(),
    ]);
  }
}

export interface IOutputChangeRecord {
  type: string;
  path: string;
  value: string;
  lastCommandId: number;
  timestamp: Date;
}
