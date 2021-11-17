import { Database as SqliteDatabase } from 'better-sqlite3';
import IViewport from '@ulixee/hero-interfaces/IViewport';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import IDeviceProfile from '@ulixee/hero-interfaces/IDeviceProfile';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import IScriptInstanceMeta from '@ulixee/hero-interfaces/IScriptInstanceMeta';
import IHeroMeta from '@ulixee/hero-interfaces/IHeroMeta';

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
        ['startDate', 'INTEGER'],
        ['closeDate', 'INTEGER'],
        ['scriptInstanceId', 'TEXT'],
        ['workingDirectory', 'TEXT'],
        ['scriptEntrypoint', 'TEXT'],
        ['scriptStartDate', 'INTEGER'],
        ['userAgentString', 'TEXT'],
        ['viewport', 'TEXT'],
        ['deviceProfile', 'TEXT'],
        ['timezoneId', 'TEXT'],
        ['locale', 'TEXT'],
        ['createSessionOptions', 'TEXT'],
      ],
      true,
    );
  }

  public insert(
    id: string,
    configuration: IHeroMeta,
    browserVersion: string,
    startDate: number,
    scriptInstanceMeta: IScriptInstanceMeta,
    deviceProfile: IDeviceProfile,
    createSessionOptions: any,
  ): void {
    const record = [
      id,
      configuration.sessionName,
      configuration.browserEmulatorId,
      browserVersion,
      configuration.humanEmulatorId,
      startDate,
      null,
      scriptInstanceMeta?.id,
      scriptInstanceMeta?.workingDirectory,
      scriptInstanceMeta?.entrypoint,
      scriptInstanceMeta?.startDate,
      configuration.userAgentString,
      JSON.stringify(configuration.viewport),
      JSON.stringify(deviceProfile),
      configuration.timezoneId,
      configuration.locale,
      JSON.stringify(createSessionOptions),
    ];
    this.insertNow(record);
  }

  public close(id: string, closeDate: number): void {
    const values = [closeDate, id];
    const fields = ['closeDate'];
    const sql = `UPDATE ${this.tableName} SET ${fields.map(n => `${n}=?`).join(', ')} WHERE id=?`;
    this.db.prepare(sql).run(...values);
    if (this.insertCallbackFn) this.insertCallbackFn([]);
  }

  public get(): ISessionRecord {
    const record = this.db.prepare(`select * from ${this.tableName}`).get() as ISessionRecord;
    record.createSessionOptions = JSON.parse(record.createSessionOptions as string);
    record.viewport = JSON.parse((record.viewport as any) ?? 'undefined');
    record.deviceProfile = JSON.parse((record.deviceProfile as any) ?? 'undefined');
    return record;
  }
}

export interface ISessionRecord {
  id: string;
  name: string;
  browserEmulatorId: string;
  browserVersion: string;
  humanEmulatorId: string;
  startDate: number;
  closeDate: number;
  scriptInstanceId: string;
  workingDirectory: string;
  scriptEntrypoint: string;
  scriptStartDate: number;
  userAgentString: string;
  viewport: IViewport;
  timezoneId: string;
  locale: string;
  deviceProfile: IDeviceProfile;
  createSessionOptions: ISessionCreateOptions;
}
