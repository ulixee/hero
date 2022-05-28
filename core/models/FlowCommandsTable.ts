import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';

export default class FlowCommandsTable extends SqliteTable<IFlowCommandsRecord> {
  constructor(db: SqliteDatabase) {
    super(db, 'FlowCommands', [
      ['id', 'INTEGER', 'NOT NULL PRIMARY KEY'],
      ['parentId', 'INTEGER'],
      ['tabId', 'INTEGER'],
      ['callsite', 'TEXT'],
    ]);
  }

  public insert(handler: IFlowCommandsRecord): void {
    this.queuePendingInsert([handler.id, handler.parentId, handler.tabId, handler.callsite]);
  }
}

export interface IFlowCommandsRecord {
  id: number;
  parentId: number;
  tabId: number;
  callsite: string;
}
