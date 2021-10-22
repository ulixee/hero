import { Database as SqliteDatabase } from 'better-sqlite3';
import INavigation, { ContentPaint, NavigationStatus } from '@ulixee/hero-interfaces/INavigation';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import { LoadStatus } from '@ulixee/hero-interfaces/Location';
import Resolvable from '@ulixee/commons/lib/Resolvable';

export default class FrameNavigationsTable extends SqliteTable<IFrameNavigationRecord> {
  public idCounter = 0;

  constructor(readonly db: SqliteDatabase) {
    super(
      db,
      'FrameNavigations',
      [
        ['id', 'INTEGER', 'NOT NULL PRIMARY KEY'],
        ['frameId', 'INTEGER'],
        ['tabId', 'INTEGER'],
        ['resourceId', 'INTEGER'],
        ['startCommandId', 'INTEGER'],
        ['requestedUrl', 'TEXT'],
        ['finalUrl', 'TEXT'],
        ['doctype', 'TEXT'],
        ['navigationReason', 'TEXT'],
        ['loaderId', 'TEXT'],
        ['initiatedTime', 'DATETIME'],
        ['httpRequestedTime', 'DATETIME'],
        ['httpRespondedTime', 'DATETIME'],
        ['httpRedirectedTime', 'DATETIME'],
        ['domContentLoadedTime', 'DATETIME'],
        ['loadTime', 'DATETIME'],
        ['contentPaintedTime', 'DATETIME'],
      ],
      true,
    );
    this.defaultSortOrder = 'initiatedTime ASC';
  }

  public insert(navigation: INavigation): void {
    const record = [
      navigation.id,
      navigation.frameId,
      navigation.tabId,
      navigation.resourceId,
      navigation.startCommandId,
      navigation.requestedUrl,
      navigation.finalUrl,
      navigation.doctype,
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

  public last(): IFrameNavigationRecord {
    return this.db
      .prepare(`select * from ${this.tableName} order by initiatedTime desc limit 1`)
      .get() as IFrameNavigationRecord;
  }

  public getMostRecentTabNavigations(
    tabId: number,
    frameIds?: Set<number>,
  ): IFrameNavigationRecord[] {
    const navigations = this.db
      .prepare(`select * from ${this.tableName} where tabId=? order by initiatedTime desc`)
      .all(tabId) as IFrameNavigationRecord[];
    if (frameIds) {
      return navigations.filter(x => frameIds.has(x.frameId));
    }
    return navigations;
  }

  public static toNavigation(
    record: IFrameNavigationRecord,
    recreateResolvable = false,
  ): INavigation {
    const entry = record as any as INavigation;
    entry.statusChanges = new Map<NavigationStatus, number>([
      [LoadStatus.HttpRequested, record.httpRequestedTime],
      [LoadStatus.HttpResponded, record.httpRespondedTime],
      [LoadStatus.HttpRedirected, record.httpRedirectedTime],
      [LoadStatus.DomContentLoaded, record.domContentLoadedTime],
      [LoadStatus.AllContentLoaded, record.loadTime],
      [LoadStatus.PaintingStable, record.contentPaintedTime],
    ]);
    if (recreateResolvable) {
      entry.resourceIdResolvable = new Resolvable();
      if (entry.resourceId) entry.resourceIdResolvable.resolve(entry.resourceId);
    }
    return entry;
  }
}

export interface IFrameNavigationRecord {
  id: number;
  frameId: number;
  tabId: number;
  doctype: string;
  resourceId?: number;
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
