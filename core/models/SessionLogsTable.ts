import { Database as SqliteDatabase } from 'better-sqlite3';
import { ILogEntry } from '@secret-agent/commons/Logger';
import SqliteTable from '@secret-agent/commons/SqliteTable';

export default class SessionLogsTable extends SqliteTable<ISessionLogRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(db, 'SessionLogs', [
      ['id', 'INTEGER'],
      ['timestamp', 'INTEGER'],
      ['action', 'TEXT'],
      ['level', 'TEXT'],
      ['module', 'TEXT'],
      ['isGlobal', 'INTEGER'],
      ['parentId', 'INTEGER'],
      ['data', 'TEXT'],
    ]);
  }

  public insert(log: ILogEntry) {
    // ignore logging these to the db - they're in the Commands table
    if (log.action === 'Command.run' || log.action === 'Command.done') return;
    if (log.data instanceof Error) {
      log.data = {
        stack: log.data.stack,
        ...log.data,
      };
    }
    const data = log.data
      ? JSON.stringify(log.data, (key, value) => {
          if (value instanceof Error) {
            return {
              stack: value.stack,
              toString: value.toString(),
              ...value,
            };
          }
          return value;
        })
      : null;
    return this.queuePendingInsert([
      log.id,
      log.timestamp.getTime(),
      log.action,
      log.level,
      log.module,
      log.sessionId !== null ? 0 : 1,
      log.parentId,
      data,
    ]);
  }

  public allErrors() {
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
