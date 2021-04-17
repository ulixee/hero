import { Database as SqliteDatabase } from 'better-sqlite3';
import IViewport from '@secret-agent/core-interfaces/IViewport';
import SqliteTable from '@secret-agent/commons/SqliteTable';

export default class SessionTable extends SqliteTable<ISessionRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(
      db,
      'Session',
      [
        ['id', 'TEXT'],
        ['name', 'TEXT'],
        ['browserEmulatorId', 'TEXT'],
        ['humanEmulatorId', 'TEXT'],
        ['hasBrowserEmulatorPolyfills', 'INTEGER'],
        ['screenWidth', 'INTEGER'],
        ['screenHeight', 'INTEGER'],
        ['deviceScaleFactor', 'INTEGER'],
        ['startDate', 'INTEGER'],
        ['closeDate', 'INTEGER'],
        ['scriptInstanceId', 'TEXT'],
        ['scriptEntrypoint', 'TEXT'],
        ['scriptStartDate', 'INTEGER'],
        ['timezoneId', 'TEXT'],
      ],
      true,
    );
  }

  public insert(
    id: string,
    name: string,
    browserEmulatorId: string,
    humanEmulatorId: string,
    hasBrowserEmulatorPolyfills: boolean,
    startDate: Date,
    scriptInstanceId: string,
    scriptEntrypoint: string,
    scriptStartDate: number,
    timezoneId: string,
    viewport: IViewport,
  ) {
    const record = [
      id,
      name,
      browserEmulatorId,
      humanEmulatorId,
      hasBrowserEmulatorPolyfills ? 1 : 0,
      viewport.screenWidth,
      viewport.screenHeight,
      viewport.deviceScaleFactor,
      startDate.getTime(),
      null,
      scriptInstanceId,
      scriptEntrypoint,
      scriptStartDate,
      timezoneId,
    ];
    this.insertNow(record);
  }

  public close(id: string, closeDate: Date) {
    const values = [closeDate.getTime(), id];
    const fields = ['closeDate'];
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
  browserEmulatorId: string;
  humanEmulatorId: string;
  hasBrowserEmulatorPolyfills: boolean;
  screenWidth: number;
  screenHeight: number;
  deviceScaleFactor: number;
  startDate: number;
  closeDate: number;
  scriptInstanceId: string;
  scriptEntrypoint: string;
  scriptStartDate: number;
  timezoneId: string;
}
