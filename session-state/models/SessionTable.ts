import { Database as SqliteDatabase } from 'better-sqlite3';
import BaseTable from '../lib/BaseTable';
import IViewport from '@secret-agent/core-interfaces/IViewport';

export default class SessionTable extends BaseTable<ISessionRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(
      db,
      'Session',
      [
        ['id', 'TEXT'],
        ['name', 'TEXT'],
        ['viewportWidth', 'INTEGER'],
        ['viewportHeight', 'INTEGER'],
        ['deviceScaleFactor', 'INTEGER'],
        ['startDate', 'TEXT'],
        ['closeDate', 'TEXT'],
        ['scriptInstanceId', 'TEXT'],
        ['scriptEntrypoint', 'TEXT'],
        ['scriptStartDate', 'TEXT'],
      ],
      true,
    );
  }

  public insert(
    id: string,
    name: string,
    startDate: Date,
    scriptInstanceId: string,
    scriptEntrypoint: string,
    scriptStartDate: string,
  ) {
    const record = [
      id,
      name,
      null,
      null,
      null,
      startDate.toISOString(),
      null,
      scriptInstanceId,
      scriptEntrypoint,
      scriptStartDate,
    ];
    this.insertNow(record);
  }

  public update(id: string, { viewport, closeDate }: { viewport: IViewport; closeDate: Date }) {
    const values = [
      viewport?.width || null,
      viewport?.height || null,
      viewport?.deviceScaleFactor || null,
      closeDate.toISOString(),
      id,
    ];
    const fields = ['viewportWidth', 'viewportHeight', 'deviceScaleFactor', 'closeDate'];
    const sql = `UPDATE ${this.tableName} SET ${fields.map(n => `${n}=?`).join(', ')} WHERE id=?`;
    this.db.prepare(sql).run(...values);
    if (this.insertCallbackFn) this.insertCallbackFn([]);
  }

  public get() {
    return this.db.prepare(`select * from ${this.tableName}`).get() as ISessionRecord;
  }
}

export interface ISessionRecord {
  id: string;
  name: string;
  viewportWidth: number;
  viewportHeight: number;
  deviceScaleFactor: number;
  startDate: string;
  closeDate: string;
  scriptInstanceId: string;
  scriptEntrypoint: string;
  scriptStartDate: string;
}
