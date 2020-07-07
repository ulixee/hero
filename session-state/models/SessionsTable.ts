import { Database as SqliteDatabase } from 'better-sqlite3';
import BaseTable from '../lib/BaseTable';

export default class SessionsTable extends BaseTable<ISessionRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(db, 'Sessions', [
      ['id', 'TEXT'],
      ['name', 'TEXT'],
      ['startDate', 'TEXT'],
      ['scriptInstanceId', 'TEXT'],
      ['scriptEntrypoint', 'TEXT'],
      ['scriptStartDate', 'TEXT'],
    ]);
  }

  public insert(
    id: string,
    name: string,
    startDate: string,
    scriptInstanceId: string,
    scriptEntrypoint: string,
    scriptStartDate: string,
  ) {
    const record = [id, name, startDate, scriptInstanceId, scriptEntrypoint, scriptStartDate];
    this.insertNow(record);
  }

  public findByName(name: string, scriptInstanceId: string) {
    const sql = `SELECT * FROM ${this.tableName} WHERE name=? AND scriptInstanceId=?`;
    return this.db.prepare(sql).get([name, scriptInstanceId]) as ISessionRecord;
  }

  public findByScriptEntrypoint(scriptEntrypoint) {
    const sql = `SELECT * FROM ${this.tableName} WHERE scriptEntrypoint=? ORDER BY scriptStartDate DESC, startDate DESC`;
    return this.db.prepare(sql).all([scriptEntrypoint]) as ISessionRecord[];
  }
}

export interface ISessionRecord {
  id: string;
  name: string;
  startDate: string;
  scriptInstanceId: string;
  scriptEntrypoint: string;
  scriptStartDate: string;
}
