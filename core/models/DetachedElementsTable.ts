import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import IDetachedElement from '@ulixee/hero-interfaces/IDetachedElement';
import { formatJsPath } from '../lib/CommandFormatter';

export default class DetachedElementsTable extends SqliteTable<
  IDetachedElement & { id?: number }
> {
  private idCounter = 0;
  constructor(db: SqliteDatabase) {
    super(
      db,
      'DetachedElements',
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

  public insert(detachedElement: IDetachedElement): void {
    this.idCounter += 1;
    detachedElement.id = this.idCounter;
    this.queuePendingInsert([
      detachedElement.id,
      detachedElement.name,
      detachedElement.timestamp,
      detachedElement.tabId,
      detachedElement.frameId,
      detachedElement.frameNavigationId,
      detachedElement.commandId,
      detachedElement.nodePath ? formatJsPath(detachedElement.nodePath) : null,
      detachedElement.documentUrl,
      detachedElement.domChangesTimestamp,
      detachedElement.nodePointerId,
      detachedElement.nodeType,
      detachedElement.nodePreview,
      null,
    ]);
  }

  public getByName(name: string): IDetachedElement[] {
    return this.db
      .prepare(`select * from ${this.tableName} where name=:name order by id asc`)
      .all({ name });
  }

  public allNames(): string[] {
    const names = this.db.prepare(`select name from ${this.tableName}`).all();
    return [...new Set(names.map(x => x.name))];
  }

  public updateHtml(element: IDetachedElement): void {
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
