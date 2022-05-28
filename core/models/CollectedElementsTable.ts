import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import ICollectedElement from '@ulixee/hero-interfaces/ICollectedElement';
import { formatJsPath } from '../lib/CommandFormatter';

export default class CollectedElementsTable extends SqliteTable<
  ICollectedElement & { id?: number }
> {
  private idCounter = 0;
  constructor(db: SqliteDatabase) {
    super(
      db,
      'CollectedElements',
      [
        ['id', 'INTEGER', 'PRIMARY KEY'],
        ['name', 'TEXT'],
        ['timestamp', 'DATETIME'],
        ['tabId', 'INTEGER'],
        ['frameId', 'INTEGER'],
        ['frameNavigationId', 'INTEGER'],
        ['commandId', 'INTEGER'],
        ['nodePath', 'TEXT'],
        ['documentUrl', 'TEXT'],
        ['domChangesTimestamp', 'DATETIME'],
        ['nodePointerId', 'INTEGER'],
        ['nodeType', 'TEXT'],
        ['nodePreview', 'TEXT'],
        ['outerHTML', 'TEXT'],
      ],
      true,
    );
    this.defaultSortOrder = 'id';
  }

  public insert(collectedElement: ICollectedElement): void {
    this.idCounter += 1;
    collectedElement.id = this.idCounter;
    this.queuePendingInsert([
      collectedElement.id,
      collectedElement.name,
      collectedElement.timestamp,
      collectedElement.tabId,
      collectedElement.frameId,
      collectedElement.frameNavigationId,
      collectedElement.commandId,
      collectedElement.nodePath ? formatJsPath(collectedElement.nodePath) : null,
      collectedElement.documentUrl,
      collectedElement.domChangesTimestamp,
      collectedElement.nodePointerId,
      collectedElement.nodeType,
      collectedElement.nodePreview,
      null,
    ]);
  }

  public getByName(name: string): ICollectedElement[] {
    return this.db
      .prepare(`select * from ${this.tableName} where name=:name order by id asc`)
      .all({ name });
  }

  public allNames(): string[] {
    const names = this.db.prepare(`select name from ${this.tableName}`).all();
    return [...new Set(names.map(x => x.name))];
  }

  public updateHtml(element: ICollectedElement): void {
    const pending = this.pendingInserts.find(x => x[0] === element.id);
    if (pending) {
      pending[7] = element.outerHTML;
      return;
    }
    this.db
      .prepare(
        `update ${this.tableName} set outerHTML=:outerHTML, documentUrl=:documentUrl where id=:id`,
      )
      .run(element);
  }
}
