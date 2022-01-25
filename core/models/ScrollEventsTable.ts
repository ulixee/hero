import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import { IScrollEvent } from '@ulixee/hero-interfaces/IScrollEvent';

export default class ScrollEventsTable extends SqliteTable<IScrollRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(db, 'ScrollEvents', [
      ['tabId', 'INTEGER'],
      ['frameId', 'INTEGER'],
      ['scrollX', 'INTEGER'],
      ['scrollY', 'INTEGER'],
      ['commandId', 'INTEGER'],
      ['timestamp', 'DATETIME'],
    ]);
  }

  public insert(
    tabId: number,
    frameId: number,
    commandId: number,
    scrollEvent: IScrollEvent,
  ): IScrollRecord {
    const [scrollX, scrollY, timestamp] = scrollEvent;
    const record = [tabId, frameId, scrollX, scrollY, commandId, timestamp];
    this.queuePendingInsert(record);
    return { tabId, frameId, scrollX, scrollY, commandId, timestamp };
  }
}

export interface IScrollRecord {
  tabId: number;
  frameId: number;
  scrollX: number;
  scrollY: number;
  commandId: number;
  timestamp: number;
}
