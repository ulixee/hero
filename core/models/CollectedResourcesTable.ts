import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';

export default class CollectedResourcesTable extends SqliteTable<ICollectedResourcesRecord> {
  private names = new Set<string>();
  constructor(readonly db: SqliteDatabase) {
    super(
      db,
      'CollectedResources',
      [
        ['name', 'TEXT', 'NOT NULL PRIMARY KEY'],
        ['resourceId', 'INTEGER'],
        ['tabId', 'INTEGER'],
      ],
      true,
    );
  }

  public insert(tabId: number, resourceId: number, name: string): void {
    if (this.names.has(name))
      throw new Error(`The collected resource name (${name}) must be unique for a session.`);
    return this.queuePendingInsert([name, resourceId, tabId]);
  }
}

export interface ICollectedResourcesRecord {
  name: string;
  resourceId: number;
  tabId: number;
}
