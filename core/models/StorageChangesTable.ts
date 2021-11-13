import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';
import { IPuppetStorageEvents } from '@ulixee/hero-interfaces/IPuppetDomStorageTracker';

export default class StorageChangesTable extends SqliteTable<IStorageChangesEntry> {
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
    entry: IPuppetStorageEvents['dom-storage-updated'] & { type: IStorageChangesEntry['type'] },
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
}

export interface IStorageChangesEntry {
  type: 'cookie' | IPuppetStorageEvents['dom-storage-updated']['type'];
  action: IPuppetStorageEvents['dom-storage-updated']['action'];
  securityOrigin: string;
  tabId: number;
  timestamp: number;
  key: string;
  value: string;
  meta: string;
}
