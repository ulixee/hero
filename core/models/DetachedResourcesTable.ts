import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';

export default class DetachedResourcesTable extends SqliteTable<IDetachedResourcesRecord> {
  constructor(db: SqliteDatabase) {
    super(
      db,
      'DetachedResources',
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

  public getByName(name: string): IDetachedResourcesRecord[] {
    return <any>this.db.prepare(`select * from ${this.tableName} where name=:name`).all({ name });
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

export interface IDetachedResourcesRecord {
  name: string;
  resourceId: number;
  tabId: number;
  timestamp: number;
  commandId: number;
}
