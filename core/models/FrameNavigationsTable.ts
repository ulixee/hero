import { Database as SqliteDatabase } from 'better-sqlite3';
import INavigation, { ContentPaint, NavigationStatus } from '@unblocked-web/specifications/agent/browser/INavigation';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import { LoadStatus } from '@unblocked-web/specifications/agent/browser/Location';
import Resolvable from '@ulixee/commons/lib/Resolvable';

export default class FrameNavigationsTable extends SqliteTable<IFrameNavigationRecord> {
  public idCounter = 0;

  private allNavigationsById = new Map<number, INavigation>();

  constructor(readonly db: SqliteDatabase) {
    super(
      db,
      'FrameNavigations',
      [
        ['id', 'INTEGER', 'NOT NULL PRIMARY KEY'],
        ['documentNavigationId', 'INTEGER'],
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
        ['javascriptReadyTime', 'DATETIME'],
        ['domContentLoadedTime', 'DATETIME'],
        ['loadTime', 'DATETIME'],
        ['contentPaintedTime', 'DATETIME'],
      ],
      true,
    );
    this.defaultSortOrder = 'initiatedTime ASC';
  }

  public getAllNavigations(): INavigation[] {
    if (!this.allNavigationsById.size) {
      for (const record of this.all()) {
        this.allNavigationsById.set(record.id, FrameNavigationsTable.toNavigation(record));
      }
    }
    return [...this.allNavigationsById.values()];
  }

  public get(id: number): INavigation {
    return this.allNavigationsById.get(id) ?? FrameNavigationsTable.toNavigation(this.getById(id));
  }

  public insert(navigation: INavigation): void {
    this.allNavigationsById.set(navigation.id, navigation);
    const record = [
      navigation.id,
      navigation.documentNavigationId,
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
      navigation.statusChanges.get(LoadStatus.JavascriptReady),
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

  public getById(id: number): IFrameNavigationRecord {
    return this.db
      .prepare(`select * from ${this.tableName} where id=?`)
      .get(id) as IFrameNavigationRecord;
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
    const entries = [
      [LoadStatus.HttpRequested, record.httpRequestedTime],
      [LoadStatus.HttpResponded, record.httpRespondedTime],
      [LoadStatus.HttpRedirected, record.httpRedirectedTime],
      [LoadStatus.JavascriptReady, record.javascriptReadyTime],
      [LoadStatus.DomContentLoaded, record.domContentLoadedTime],
      [LoadStatus.AllContentLoaded, record.loadTime],
      [ContentPaint, record.contentPaintedTime],
    ].filter(x => !!x[1]);

    entry.statusChanges = new Map<NavigationStatus, number>(entries as any);
    if (recreateResolvable) {
      entry.resourceIdResolvable = new Resolvable();
      if (entry.resourceId) entry.resourceIdResolvable.resolve(entry.resourceId);
    }
    return entry;
  }
}

export interface IFrameNavigationRecord {
  id: number;
  documentNavigationId: number;
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
  javascriptReadyTime?: number;
  domContentLoadedTime?: number;
  loadTime?: number;
  contentPaintedTime?: number;
}
