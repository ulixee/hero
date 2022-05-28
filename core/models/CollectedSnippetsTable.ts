import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';
import ICollectedSnippet from '@ulixee/hero-interfaces/ICollectedSnippet';

export default class CollectedSnippetsTable extends SqliteTable<ICollectedSnippet> {
  constructor(db: SqliteDatabase) {
    super(db, 'CollectedSnippets', [
      ['name', 'TEXT'],
      ['value', 'TEXT'],
      ['timestamp', 'DATETIME'],
      ['commandId', 'INTEGER'],
    ]);
  }

  public getByName(name: string): ICollectedSnippet[] {
    return this.db
      .prepare(`select * from ${this.tableName} where name=:name`)
      .all({ name })
      .map((x: ICollectedSnippet) => {
        return {
          ...x,
          value: TypeSerializer.parse(x.value),
        };
      });
  }

  public insert(
    name: string,
    value: any,
    timestamp: number,
    commandId: number,
  ): ICollectedSnippet {
    this.queuePendingInsert([
      name,
      TypeSerializer.stringify(value),
      timestamp,
      commandId,
    ]);
    return { name, value, timestamp, commandId };
  }
}
