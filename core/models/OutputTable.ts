import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';

export default class OutputTable extends SqliteTable<IOutputChangeRecord> {
  constructor(db: SqliteDatabase) {
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

  public insert(record: IOutputChangeRecord): void {
    record.value = TypeSerializer.stringify(record.value);
    const { type, path, value, lastCommandId, timestamp } = record;
    this.queuePendingInsert([type, path, value, lastCommandId, timestamp]);
  }

  public override all(): IOutputChangeRecord[] {
    return super.all().map(x => ({
      ...x,
      value: TypeSerializer.parse(x.value),
    }));
  }
}

export interface IOutputChangeRecord {
  type: string;
  path: string;
  value: string;
  lastCommandId: number;
  timestamp: number;
}
