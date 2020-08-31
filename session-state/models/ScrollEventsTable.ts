import { Database as SqliteDatabase } from 'better-sqlite3';
import { IScrollEvent } from '@secret-agent/injected-scripts/interfaces/IScrollEvent';
import BaseTable from '../lib/BaseTable';

export default class ScrollEventsTable extends BaseTable<IScrollRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(db, 'ScrollEvents', [
      ['scrollX', 'INTEGER'],
      ['scrollY', 'INTEGER'],
      ['commandId', 'INTEGER'],
      ['timestamp', 'TEXT'],
    ]);
  }

  public insert(scrollEvent: IScrollEvent) {
    const [commandId, scrollX, scrollY, timestamp] = scrollEvent;
    const record = [scrollX, scrollY, commandId, timestamp];
    this.queuePendingInsert(record);
  }
}

export interface IScrollRecord {
  scrollX: number;
  scrollY: number;
  commandId: number;
  timestamp: string;
}
