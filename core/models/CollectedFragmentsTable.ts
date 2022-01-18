import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';

export default class CollectedFragmentsTable extends SqliteTable<ICollectedFragment> {
  private names = new Set<string>();
  constructor(readonly db: SqliteDatabase) {
    super(
      db,
      'CollectedFragments',
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

  public insert(fragment: ICollectedFragment): void {
    if (this.names.has(fragment.name))
      throw new Error(
        `The collected fragment name (${fragment.name}) must be unique for a session.`,
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

export interface ICollectedFragment {
  name: string;
  commandId: number;
  frameNavigationId: number;
  domChangeEventIndex: number;
  nodePointerId: number;
  nodeType: string;
  nodePreview: string;
}
