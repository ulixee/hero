import { Database as SqliteDatabase } from 'better-sqlite3';
import BaseTable from '../lib/BaseTable';
import { IScrollEvent } from '@secret-agent/injected-scripts/interfaces/IScrollEvent';

export default class ScrollEventsTable extends BaseTable<IScrollRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(
      db,
      'ScrollEvents',
      [
        ['scrollX', 'INTEGER'],
        ['scrollY', 'INTEGER'],
        ['commandId', 'INTEGER'],
        ['timestamp', 'TEXT'],
      ],
      true,
    );
  }

  public insert(scrollEvent: IScrollEvent) {
    const [commandId, scrollX, scrollY, timestamp] = scrollEvent;
    const record = [scrollX, scrollY, commandId, timestamp];
    this.pendingInserts.push(record);
  }

  public all() {
    return this.db.prepare(`select * from ${this.tableName}`).all() as IScrollRecord[];
  }
}

export interface IScrollRecord {
  scrollX: number;
  scrollY: number;
  commandId: number;
  timestamp: string;
}
