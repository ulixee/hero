import { LocationStatus } from '@secret-agent/core-interfaces/Location';
import { Database as SqliteDatabase } from 'better-sqlite3';
import INavigation from '@secret-agent/core-interfaces/INavigation';
import SqliteTable from '@secret-agent/commons/SqliteTable';

export default class FrameNavigationsTable extends SqliteTable<IFrameNavigationRecord> {
  private idCounter = 0;

  constructor(readonly db: SqliteDatabase) {
    super(
      db,
      'FrameNavigations',
      [
        ['id', 'INTEGER', 'NOT NULL PRIMARY KEY'],
        ['frameId', 'TEXT'],
        ['startCommandId', 'INTEGER'],
        ['requestedUrl', 'TEXT'],
        ['finalUrl', 'TEXT'],
        ['navigationReason', 'TEXT'],
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
      navigation.initiatedTime.getTime(),
      navigation.stateChanges.get(LocationStatus.HttpRequested)?.getTime(),
      navigation.stateChanges.get(LocationStatus.HttpResponded)?.getTime(),
      navigation.stateChanges.get(LocationStatus.HttpRedirected)?.getTime(),
      navigation.stateChanges.get(LocationStatus.DomContentLoaded)?.getTime(),
      navigation.stateChanges.get('Load')?.getTime(),
      navigation.stateChanges.get('ContentPaint')?.getTime(),
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
  frameId: string;
  requestedUrl: string;
  finalUrl?: string;
  startCommandId: number;
  navigationReason: string;
  initiatedTime: Date;
  httpRequestedTime: number;
  httpRespondedTime: number;
  httpRedirectedTime?: number;
  domContentLoadedTime?: number;
  loadTime?: number;
  contentPaintedTime?: number;
}
