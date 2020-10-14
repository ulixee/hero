import { Database as SqliteDatabase } from 'better-sqlite3';
import BaseTable from '../lib/BaseTable';

export default class TabsTable extends BaseTable<ITabsRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(db, 'Tabs', [
      ['tabId', 'TEXT'],
      ['openerTabId', 'TEXT'],
      ['pageTargetId', 'TEXT'],
      ['sessionId', 'TEXT'],
    ]);
  }

  public insert(tabId: string, pageId: string, devtoolsSessionId: string, openerTabId?: string) {
    return this.queuePendingInsert([tabId, openerTabId, pageId, devtoolsSessionId]);
  }
}

export interface ITabsRecord {
  tabId: string;
  openerTabId?: string;
  pageTargetId: string;
  sessionId: string;
}
