import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import ICollectedFragment from '@ulixee/hero-interfaces/ICollectedFragment';

export default class CollectedFragmentsTable extends SqliteTable<
  ICollectedFragment & { id?: number }
> {
  private idCounter = 0;
  constructor(readonly db: SqliteDatabase) {
    super(
      db,
      'CollectedFragments',
      [
        ['id', 'INTEGER', 'PRIMARY KEY'],
        ['name', 'TEXT'],
        ['tabId', 'INTEGER'],
        ['frameId', 'INTEGER'],
        ['frameNavigationId', 'INTEGER'],
        ['commandId', 'INTEGER'],
        ['domChangesTimestamp', 'INTEGER'],
        ['nodePointerId', 'INTEGER'],
        ['nodeType', 'TEXT'],
        ['nodePreview', 'TEXT'],
        ['outerHTML', 'TEXT'],
      ],
      true,
    );
    this.defaultSortOrder = 'id';
  }

  public insert(fragment: ICollectedFragment): void {
    this.idCounter += 1;
    fragment.id = this.idCounter;
    this.queuePendingInsert([
      fragment.id,
      fragment.name,
      fragment.tabId,
      fragment.frameId,
      fragment.frameNavigationId,
      fragment.commandId,
      fragment.domChangesTimestamp,
      fragment.nodePointerId,
      fragment.nodeType,
      fragment.nodePreview,
      null,
    ]);
  }

  public getByName(name: string): ICollectedFragment[] {
    return this.db
      .prepare(`select * from ${this.tableName} where name=:name order by id asc`)
      .all({ name });
  }

  public updateHtml(fragment: ICollectedFragment): void {
    const pending = this.pendingInserts.find(x => x[0] === fragment.id);
    if (pending) {
      pending[7] = fragment.outerHTML;
      return;
    }
    this.db.prepare(`update ${this.tableName} set outerHTML=:outerHTML where id=:id`).run(fragment);
  }
}
