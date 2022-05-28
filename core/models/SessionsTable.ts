import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import { Session } from '../index';

export default class SessionsTable extends SqliteTable<ISessionsRecord> {
  constructor(db: SqliteDatabase) {
    super(db, 'Sessions', [
      ['id', 'TEXT'],
      ['name', 'TEXT'],
      ['startDate', 'TEXT'],
      ['scriptInstanceId', 'TEXT'],
      ['scriptEntrypoint', 'TEXT'],
      ['scriptStartDate', 'TEXT'],
      ['workingDirectory', 'TEXT'],
    ]);
  }

  public insert(session: Session): void {
    const { options, createdTime } = session;
    const { scriptInstanceMeta } = options;

    const record = [
      session.id,
      options.sessionName,
      new Date(createdTime).toISOString(),
      scriptInstanceMeta?.id,
      scriptInstanceMeta?.entrypoint,
      new Date(scriptInstanceMeta?.startDate).toISOString(),
      scriptInstanceMeta?.workingDirectory,
    ];
    this.insertNow(record);
  }

  public findByName(name: string, scriptInstanceId: string): ISessionsRecord {
    const sql = `SELECT * FROM ${this.tableName} WHERE name=? AND scriptInstanceId=? ORDER BY scriptStartDate DESC, startDate DESC LIMIT 1`;
    return this.db.prepare(sql).get([name, scriptInstanceId]) as ISessionsRecord;
  }

  public findByScriptEntrypoint(scriptEntrypoint, limit = 50): ISessionsRecord[] {
    const sql = `SELECT * FROM ${
      this.tableName
    } WHERE scriptEntrypoint=? ORDER BY scriptStartDate DESC, startDate DESC limit ${limit ?? 50}`;
    return this.db.prepare(sql).all([scriptEntrypoint]) as ISessionsRecord[];
  }
}

export interface ISessionsRecord {
  id: string;
  name: string;
  startDate: string;
  scriptInstanceId: string;
  scriptEntrypoint: string;
  scriptStartDate: string;
  workingDirectory: string;
}
