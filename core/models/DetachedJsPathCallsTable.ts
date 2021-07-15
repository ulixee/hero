import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/SqliteTable';
import IScriptInstanceMeta from '@ulixee/hero-interfaces/IScriptInstanceMeta';
import { IJsPathHistory } from '../lib/JsPath';

export default class DetachedJsPathCallsTable extends SqliteTable<IDetachedJsPathCallsRecord> {
  private cacheByCallsiteKey: {
    [entrypoint_callsitepath_key: string]: IDetachedJsPathCallsRecord;
  } = {};

  constructor(readonly db: SqliteDatabase) {
    super(db, 'DetachedJsPathCalls', [
      ['scriptEntrypoint', 'TEXT'],
      ['callsitePath', 'TEXT'],
      ['execJsPathHistory', 'TEXT'],
      ['timestamp', 'INTEGER'],
      ['key', 'TEXT'],
    ]);
  }

  public insert(
    scriptMeta: IScriptInstanceMeta,
    callsitePath: string,
    execJsPathHistory: IJsPathHistory[],
    timestamp: Date,
    key = 'default',
  ): void {
    if (!scriptMeta) return;
    const { entrypoint: scriptEntrypoint } = scriptMeta;
    const record = {
      scriptEntrypoint,
      callsitePath,
      timestamp: timestamp.getTime(),
      execJsPathHistory: JSON.stringify(execJsPathHistory),
      key,
    };
    const existing = this.getCachedRecord(scriptMeta, callsitePath, key);
    // already stored
    if (existing?.execJsPathHistory === record.execJsPathHistory) return;

    this.insertNow([
      record.scriptEntrypoint,
      record.callsitePath,
      record.execJsPathHistory,
      record.timestamp,
      record.key,
    ]);
    this.cacheRecord(record);
  }

  public find(
    scriptMeta: IScriptInstanceMeta,
    callsite: string,
    key = 'default',
  ): IDetachedJsPathCallsRecord {
    if (!scriptMeta) return null;

    const cached = this.getCachedRecord(scriptMeta, callsite, key);
    if (cached) return cached;

    try {
      const result = this.db
        .prepare(
          `select * from ${this.tableName} where scriptEntrypoint=? and callsitePath=? and key=? order by timestamp desc limit 1`,
        )
        .get(scriptMeta.entrypoint, callsite, key);

      if (result) this.cacheRecord(result);

      return result;
    } catch (err) {
      if (String(err).includes('no such table')) return;
      throw err;
    }
  }

  private getCachedRecord(
    scriptMeta: IScriptInstanceMeta,
    callsite: string,
    key: string,
  ): IDetachedJsPathCallsRecord {
    const entrypoint = scriptMeta?.entrypoint ?? '';
    const cacheKey = DetachedJsPathCallsTable.getCacheKey(entrypoint, callsite, key);
    return this.cacheByCallsiteKey[cacheKey];
  }

  private cacheRecord(record: IDetachedJsPathCallsRecord): void {
    const cacheKey = DetachedJsPathCallsTable.getCacheKey(
      record.scriptEntrypoint,
      record.callsitePath,
      record.key,
    );
    this.cacheByCallsiteKey[cacheKey] = record;
  }

  private static getCacheKey(scriptEntrypoint: string, callsitePath: string, key: string): string {
    return `${scriptEntrypoint}_${callsitePath}_${key}`;
  }
}

export interface IDetachedJsPathCallsRecord {
  scriptEntrypoint: string;
  callsitePath: string;
  execJsPathHistory: string;
  timestamp: number;
  key: string;
}
