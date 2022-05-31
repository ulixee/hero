import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';

export default class CollectedResourcesTable extends SqliteTable<ICollectedResourcesRecord> {
  constructor(db: SqliteDatabase) {
    super(
      db,
      'CollectedResources',
      [
        ['name', 'TEXT'],
        ['resourceId', 'INTEGER'],
        ['tabId', 'INTEGER'],
        ['timestamp', 'DATETIME'],
        ['commandId', 'INTEGER'],
      ],
      true,
    );
  }

  public getByName(name: string): ICollectedResourcesRecord[] {
    return this.db.prepare(`select * from ${this.tableName} where name=:name`).all({ name });
  }

  public insert(
    tabId: number,
    resourceId: number,
    name: string,
    timestamp: number,
    commandId: number,
  ): void {
    return this.queuePendingInsert([
      name,
      resourceId,
      tabId,
      timestamp,
      commandId,
    ]);
  }
}

export interface ICollectedResourcesRecord {
  name: string;
  resourceId: number;
  tabId: number;
  timestamp: number;
  commandId: number;
}
