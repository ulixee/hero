import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';

export default class FragmentsTable extends SqliteTable<IFragment> {
  private names = new Set<string>();
  constructor(readonly db: SqliteDatabase) {
    super(
      db,
      'Fragments',
      [
        ['name', 'TEXT', 'NOT NULL PRIMARY KEY'],
        ['commandId', 'INTEGER'],
        ['frameNavigationId', 'INTEGER'],
        ['domChangeEventIndex', 'INTEGER'],
        ['nodePointerId', 'INTEGER'],
        ['nodeType', 'TEXT'],
        ['nodePreview', 'TEXT'],
      ],
      true,
    );
  }

  public insert(fragment: IFragment): void {
    if (this.names.has(fragment.name))
      throw new Error(
        `The provided fragment name (${fragment.name}) must be unique for a session.`,
      );
    this.queuePendingInsert([
      fragment.name,
      fragment.commandId,
      fragment.frameNavigationId,
      fragment.domChangeEventIndex,
      fragment.nodePointerId,
      fragment.nodeType,
      fragment.nodePreview,
    ]);
  }
}

export interface IFragment {
  name: string;
  commandId: number;
  frameNavigationId: number;
  domChangeEventIndex: number;
  nodePointerId: number;
  nodeType: string;
  nodePreview: string;
}
