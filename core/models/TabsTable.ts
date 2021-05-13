import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@secret-agent/commons/SqliteTable';
import IViewport from '@secret-agent/interfaces/IViewport';

export default class TabsTable extends SqliteTable<ITabsRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(db, 'Tabs', [
      ['tabId', 'INTEGER'],
      ['parentTabId', 'INTEGER'],
      ['detachedAtCommandId', 'INTEGER'],
      ['pageTargetId', 'TEXT'],
      ['sessionId', 'TEXT'],
      ['viewportWidth', 'INTEGER'],
      ['viewportHeight', 'INTEGER'],
      ['browserPositionX', 'INTEGER'],
      ['browserPositionY', 'INTEGER'],
      ['createdTime', 'INTEGER'],
    ]);
  }

  public insert(
    tabId: number,
    pageId: string,
    devtoolsSessionId: string,
    viewPort: IViewport,
    parentTabId?: number,
    detachedAtCommandId?: number,
  ) {
    return this.queuePendingInsert([
      tabId,
      parentTabId,
      detachedAtCommandId,
      pageId,
      devtoolsSessionId,
      viewPort.width,
      viewPort.height,
      viewPort.positionX,
      viewPort.positionY,
      new Date().getTime(),
    ]);
  }
}

export interface ITabsRecord {
  tabId: number;
  parentTabId: number | null;
  detachedAtCommandId: number | null;
  pageTargetId: string;
  sessionId: string;
  viewportWidth: number;
  viewportHeight: number;
  browserPositionX: number;
  browserPositionY: number;
  createdTime: number;
}
