import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';
import ICollectedSnippet from '@ulixee/hero-interfaces/ICollectedSnippet';

export default class CollectedSnippetsTable extends SqliteTable<ICollectedSnippet> {
  constructor(readonly db: SqliteDatabase) {
    super(db, 'CollectedSnippets', [
      ['name', 'TEXT'],
      ['value', 'TEXT'],
    ]);
  }

  public getByName(name: string): ICollectedSnippet[] {
    return this.db
      .prepare(`select * from ${this.tableName} where name=:name`)
      .all({ name })
      .map((x: ICollectedSnippet) => {
        return {
          name: x.name,
          value: TypeSerializer.parse(x.value),
        };
      });
  }

  public insert(name: string, value: any): void {
    return this.queuePendingInsert([name, TypeSerializer.stringify(value)]);
  }
}
