import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';
import { IDomStorageEvents } from '@unblocked-web/secret-agent/lib/DomStorageTracker';

export default class StorageChangesTable extends SqliteTable<IStorageChangesEntry> {
  private changesByTabIdAndTime: {
    [tabId_timestamp: string]: { tabId: number; timestamp: number; count: number };
  } = {};

  private hasLoadedCounts = false;

  constructor(readonly db: SqliteDatabase) {
    super(db, 'StorageChanges', [
      ['tabId', 'INTEGER'],
      ['securityOrigin', 'TEXT'],
      ['type', 'TEXT'],
      ['action', 'TEXT'],
      ['key', 'TEXT'],
      ['value', 'TEXT'],
      ['meta', 'TEXT'],
      ['timestamp', 'INTEGER'],
    ]);
    this.defaultSortOrder = 'id ASC';
  }

  public insert(
    tabId: number,
    frameId: number,
    entry: IDomStorageEvents['dom-storage-updated'] & { type: IStorageChangesEntry['type'] },
  ): void {
    this.queuePendingInsert([
      tabId,
      entry.securityOrigin,
      entry.type,
      entry.action,
      entry.key,
      entry.value,
      TypeSerializer.stringify(entry.meta),
      entry.timestamp,
    ]);
    this.trackChangeTime(tabId, entry.timestamp);
  }

  public findChange(
    tabId: number,
    filter: Omit<IStorageChangesEntry, 'tabId' | 'timestamp' | 'value' | 'meta'>,
  ): IStorageChangesEntry {
    return this.db
      .prepare(
        `select * from ${this.tableName}
                where tabId = ? and securityOrigin = :securityOrigin
                    and type = :type and action = :action and key = :key
                limit 1`,
      )
      .get(tabId, filter);
  }

  public withTimeInRange(
    tabId: number,
    startTime: number,
    endTime: number,
  ): IStorageChangesEntry[] {
    return this.db
      .prepare(
        `select * from ${this.tableName} where tabId = ? and timestamp >= ? and timestamp <= ?`,
      )
      .all(tabId, startTime, endTime);
  }

  public getChangesByTabIdAndTime(): { tabId: number; timestamp: number; count: number }[] {
    if (!this.hasLoadedCounts) {
      this.hasLoadedCounts = true;
      const timestamps = this.db.prepare(`select timestamp, tabId from ${this.tableName}`).all();
      for (const { timestamp, tabId } of timestamps) {
        this.trackChangeTime(tabId, timestamp);
      }
    }
    const times = Object.values(this.changesByTabIdAndTime);
    times.sort((a, b) => a.timestamp - b.timestamp);
    return times;
  }

  private trackChangeTime(tabId: number, timestamp: number): void {
    this.hasLoadedCounts = true;
    const key = `${tabId}_${timestamp}`;
    this.changesByTabIdAndTime[key] ??= { tabId, timestamp, count: 0 };
    this.changesByTabIdAndTime[key].count += 1;
  }
}

export interface IStorageChangesEntry {
  type: 'cookie' | IDomStorageEvents['dom-storage-updated']['type'];
  action: IDomStorageEvents['dom-storage-updated']['action'];
  securityOrigin: string;
  tabId: number;
  timestamp: number;
  key: string;
  value: string;
  meta: string;
}
