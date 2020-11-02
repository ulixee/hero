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
        ['emulatorId', 'TEXT'],
        ['humanoidId', 'TEXT'],
        ['hasEmulatorPolyfills', 'INTEGER'],
        ['screenWidth', 'INTEGER'],
        ['screenHeight', 'INTEGER'],
        ['deviceScaleFactor', 'INTEGER'],
        ['startDate', 'TEXT'],
        ['closeDate', 'TEXT'],
        ['scriptInstanceId', 'TEXT'],
        ['scriptEntrypoint', 'TEXT'],
        ['scriptStartDate', 'TEXT'],
        ['timezoneId', 'TEXT'],
      ],
      true,
    );
  }

  public insert(
    id: string,
    name: string,
    emulatorId: string,
    humanoidId: string,
    hasEmulatorPolyfills: boolean,
    startDate: Date,
    scriptInstanceId: string,
    scriptEntrypoint: string,
    scriptStartDate: string,
    timezoneId: string,
    viewport: IViewport,
  ) {
    const record = [
      id,
      name,
      emulatorId,
      humanoidId,
      hasEmulatorPolyfills ? 1 : 0,
      viewport.screenWidth,
      viewport.screenHeight,
      viewport.deviceScaleFactor,
      startDate.toISOString(),
      null,
      scriptInstanceId,
      scriptEntrypoint,
      scriptStartDate,
      timezoneId,
    ];
    this.insertNow(record);
  }

  public close(id: string, closeDate: Date) {
    const values = [closeDate.toISOString(), id];
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
  emulatorId: string;
  humanoidId: string;
  hasEmulatorPolyfills: boolean;
  screenWidth: number;
  screenHeight: number;
  deviceScaleFactor: number;
  startDate: string;
  closeDate: string;
  scriptInstanceId: string;
  scriptEntrypoint: string;
  scriptStartDate: string;
  timezoneId: string;
}
