import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';

export default class FlowHandlersTable extends SqliteTable<IFlowHandlerRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(db, 'FlowHandlers', [
      ['id', 'INTEGER', 'NOT NULL PRIMARY KEY'],
      ['tabId', 'INTEGER'],
      ['name', 'TEXT'],
      ['callsite', 'TEXT'],
    ]);
  }

  public insert(handler: IFlowHandlerRecord): void {
    this.queuePendingInsert([handler.id, handler.tabId, handler.name, handler.callsite]);
  }
}

export interface IFlowHandlerRecord {
  id: number;
  tabId: number;
  name?: string;
  callsite: string;
}
