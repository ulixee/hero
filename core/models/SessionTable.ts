import { Database as SqliteDatabase } from 'better-sqlite3';
import IViewport from '@ulixee/unblocked-specification/agent/browser/IViewport';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import IDeviceProfile from '@ulixee/unblocked-specification/plugin/IDeviceProfile';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import IScriptInstanceMeta from '@ulixee/hero-interfaces/IScriptInstanceMeta';
import IHeroMeta from '@ulixee/hero-interfaces/IHeroMeta';

export default class SessionTable extends SqliteTable<ISessionRecord> {
  private id: string;

  constructor(db: SqliteDatabase) {
    super(
      db,
      'Session',
      [
        ['id', 'TEXT'],
        ['name', 'TEXT'],
        ['browserName', 'TEXT'],
        ['browserFullVersion', 'TEXT'],
        ['operatingSystemName', 'TEXT'],
        ['operatingSystemVersion', 'TEXT'],
        ['renderingEngine', 'TEXT'],
        ['renderingEngineVersion', 'TEXT'],
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
        ['publicIp', 'TEXT'],
        ['proxyIp', 'TEXT'],
        ['createSessionOptions', 'TEXT'],
      ],
      true,
    );
  }

  public insert(
    id: string,
    configuration: IHeroMeta,
    browserName: string,
    browserFullVersion: string,
    startDate: number,
    scriptInstanceMeta: IScriptInstanceMeta,
    deviceProfile: IDeviceProfile,
    createSessionOptions: any,
  ): void {
    this.id = id;
    const record = [
      this.id,
      configuration.sessionName,
      browserName,
      browserFullVersion,
      configuration.operatingSystemName,
      configuration.operatingSystemVersion,
      configuration.renderingEngine,
      configuration.renderingEngineVersion,
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
      configuration.upstreamProxyIpMask?.publicIp,
      configuration.upstreamProxyIpMask?.proxyIp,
      JSON.stringify(createSessionOptions),
    ];
    this.insertNow(record);
  }

  public updateConfiguration(configuration: IHeroMeta): void {
    const toUpdate = {
      viewport: JSON.stringify(configuration.viewport),
      timezoneId: configuration.timezoneId,
      locale: configuration.locale,
      publicIp: configuration.upstreamProxyIpMask?.publicIp,
      proxyIp: configuration.upstreamProxyIpMask?.proxyIp,
    };

    this.db
      .prepare(
        `UPDATE ${this.tableName} SET viewport=:viewport, timezoneId=:timezoneId, locale=:locale, publicIp=:publicIp, proxyIp=:proxyIp WHERE id=?`,
      )
      .run(this.id, toUpdate);
    if (this.insertCallbackFn) this.insertCallbackFn([]);
  }

  public close(closeDate: number): void {
    const values = [closeDate, this.id];
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
  renderingEngine: string;
  renderingEngineVersion: string;
  browserName: string;
  browserFullVersion: string;
  operatingSystemName: string;
  operatingSystemVersion: string;
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
  publicIp?: string;
  proxyIp?: string;
  deviceProfile: IDeviceProfile;
  createSessionOptions: ISessionCreateOptions;
}
