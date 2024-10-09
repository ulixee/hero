import { Database as SqliteDatabase } from 'better-sqlite3';
import { ILogEntry } from '@ulixee/commons/lib/Logger';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';

export default class SessionLogsTable extends SqliteTable<ISessionLogRecord> {
  constructor(db: SqliteDatabase) {
    super(db, 'SessionLogs', [
      ['id', 'INTEGER'],
      ['timestamp', 'DATETIME'],
      ['action', 'TEXT'],
      ['level', 'TEXT'],
      ['module', 'TEXT'],
      ['isGlobal', 'INTEGER'],
      ['parentId', 'INTEGER'],
      ['data', 'TEXT'],
    ]);
  }

  public insert(log: ILogEntry): void {
    // ignore logging these to the db - they're in the Commands table
    if (
      log.action === 'Command.run' ||
      log.action === 'Command.done' ||
      log.module.includes('DevtoolsSessionLogger')
    )
      return;
    if (log.data instanceof Error) {
      log.data = {
        stack: log.data.stack,
        ...log.data,
      };
    }
    const context = log.data?.context;

    let data = log.data
      ? JSON.stringify(log.data, (key, value) => {
          if (value instanceof Error) {
            return {
              stack: value.stack,
              toString: value.toString(),
              ...value,
            };
          }
          if (value instanceof BigInt || typeof value === 'bigint') {
            return `${value.toString()}n`;
          }
          if (value instanceof RegExp) {
            return `/${value.source}/${value.flags}`;
          }
          if (value === context) {
            if (!Object.keys(value).length) return undefined;

            const ctx: any = {};
            for (const x of Object.keys(value)) {
              if (x === 'sessionId' || x === 'browserContextId') continue;
              ctx[x] = value[x];
            }
            if (!Object.keys(ctx).length) return undefined;
            return ctx;
          }
          return value;
        })
      : null;
    if (data === '{}') data = undefined;

    return this.queuePendingInsert([
      log.id,
      log.timestamp.getTime(),
      log.action,
      log.level,
      log.module,
      !log.sessionId ? 1 : undefined,
      log.parentId,
      data,
    ]);
  }

  public allErrors(): ISessionLogRecord[] {
    return this.db
      .prepare(`select * from ${this.tableName} where level = 'error'`)
      .all() as ISessionLogRecord[];
  }
}

export interface ISessionLogRecord {
  id: number;
  timestamp: number;
  action: string;
  level: string;
  module: string;
  isGlobal?: boolean;
  parentId?: number;
  data?: any;
}
