import { Database as SqliteDatabase } from 'better-sqlite3';
import INavigation, { ContentPaint } from '@ulixee/hero-interfaces/INavigation';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import { LoadStatus } from '@ulixee/hero-interfaces/Location';

export default class FrameNavigationsTable extends SqliteTable<IFrameNavigationRecord> {
  private idCounter = 0;

  constructor(readonly db: SqliteDatabase) {
    super(
      db,
      'FrameNavigations',
      [
        ['id', 'INTEGER', 'NOT NULL PRIMARY KEY'],
        ['frameId', 'INTEGER'],
        ['startCommandId', 'INTEGER'],
        ['requestedUrl', 'TEXT'],
        ['finalUrl', 'TEXT'],
        ['navigationReason', 'TEXT'],
        ['loaderId', 'TEXT'],
        ['initiatedTime', 'INTEGER'],
        ['httpRequestedTime', 'INTEGER'],
        ['httpRespondedTime', 'INTEGER'],
        ['httpRedirectedTime', 'INTEGER'],
        ['domContentLoadedTime', 'INTEGER'],
        ['loadTime', 'INTEGER'],
        ['contentPaintedTime', 'INTEGER'],
      ],
      true,
    );
    this.defaultSortOrder = 'initiatedTime ASC';
  }

  public insert(navigation: INavigation) {
    if (!navigation.id) {
      this.idCounter += 1;
      navigation.id = this.idCounter;
    }
    const record = [
      navigation.id,
      navigation.frameId,
      navigation.startCommandId,
      navigation.requestedUrl,
      navigation.finalUrl,
      navigation.navigationReason,
      navigation.loaderId,
      navigation.initiatedTime,
      navigation.statusChanges.get(LoadStatus.HttpRequested),
      navigation.statusChanges.get(LoadStatus.HttpResponded),
      navigation.statusChanges.get(LoadStatus.HttpRedirected),
      navigation.statusChanges.get(LoadStatus.DomContentLoaded),
      navigation.statusChanges.get(LoadStatus.AllContentLoaded),
      navigation.statusChanges.get(ContentPaint),
    ];
    this.queuePendingInsert(record);
  }

  public last() {
    return this.db
      .prepare(`select * from ${this.tableName} order by initiatedTime desc limit 1`)
      .get() as IFrameNavigationRecord;
  }
}

export interface IFrameNavigationRecord {
  id: number;
  frameId: number;
  requestedUrl: string;
  finalUrl?: string;
  loaderId: string;
  startCommandId: number;
  navigationReason: string;
  initiatedTime: number;
  httpRequestedTime: number;
  httpRespondedTime: number;
  httpRedirectedTime?: number;
  domContentLoadedTime?: number;
  loadTime?: number;
  contentPaintedTime?: number;
}
