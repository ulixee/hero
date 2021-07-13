import { Database as SqliteDatabase } from 'better-sqlite3';
import IViewport from '@secret-agent/interfaces/IViewport';
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
        ['browserVersion', 'TEXT'],
        ['humanEmulatorId', 'TEXT'],
        ['screenWidth', 'INTEGER'],
        ['screenHeight', 'INTEGER'],
        ['deviceScaleFactor', 'INTEGER'],
        ['startDate', 'INTEGER'],
        ['closeDate', 'INTEGER'],
        ['scriptInstanceId', 'TEXT'],
        ['scriptEntrypoint', 'TEXT'],
        ['scriptStartDate', 'INTEGER'],
        ['timezoneId', 'TEXT'],
        ['locale', 'TEXT'],
        ['createSessionOptions', 'TEXT'],
      ],
      true,
    );
  }

  public insert(
    id: string,
    name: string,
    browserEmulatorId: string,
    browserVersion: string,
    humanEmulatorId: string,
    startDate: Date,
    scriptInstanceId: string,
    scriptEntrypoint: string,
    scriptStartDate: number,
    timezoneId: string,
    viewport: IViewport,
    locale: string,
    createSessionOptions: any,
  ) {
    const record = [
      id,
      name,
      browserEmulatorId,
      browserVersion,
      humanEmulatorId,
      viewport.screenWidth,
      viewport.screenHeight,
      viewport.deviceScaleFactor,
      startDate.getTime(),
      null,
      scriptInstanceId,
      scriptEntrypoint,
      scriptStartDate,
      timezoneId,
      locale,
      JSON.stringify(createSessionOptions),
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
  browserVersion: string;
  humanEmulatorId: string;
  screenWidth: number;
  screenHeight: number;
  deviceScaleFactor: number;
  startDate: number;
  closeDate: number;
  scriptInstanceId: string;
  scriptEntrypoint: string;
  scriptStartDate: number;
  timezoneId: string;
  locale: string;
  createSessionOptions: string;
}
