import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';

export default class AwaitedEventsTable extends SqliteTable<IEventRecord> {
  private idCounter = 0;
  constructor(readonly db: SqliteDatabase) {
    super(
      db,
      'AwaitedEvents',
      [
        ['id', 'INTEGER', 'NOT NULL PRIMARY KEY'],
        ['tabId', 'INTEGER'],
        ['frameId', 'INTEGER'],
        ['run', 'INTEGER'],
        ['listenerId', 'INTEGER'],
        ['eventArgs', 'TEXT'],
        ['timestamp', 'DATETIME'],
        ['publishedAtCommandId', 'INTEGER'],
      ],
      true,
    );
    this.defaultSortOrder = 'id ASC';
  }

  public insert(eventRecord: Omit<IEventRecord, 'id'>): void {
    const id = (this.idCounter += 1);
    (eventRecord as IEventRecord).id = id;
    this.queuePendingInsert([
      id,
      eventRecord.tabId,
      eventRecord.frameId,
      eventRecord.run,
      eventRecord.listenerId,
      TypeSerializer.stringify(eventRecord.eventArgs),
      eventRecord.timestamp,
      eventRecord.publishedAtCommandId,
    ]);
  }
}

export interface IEventRecord {
  id: number;
  tabId: number;
  frameId: number;
  run: number;
  listenerId: string;
  eventArgs: any;
  timestamp: number;
  publishedAtCommandId: number;
}
