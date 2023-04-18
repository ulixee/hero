import { Database as SqliteDatabase } from 'better-sqlite3';
import IViewport from '@ulixee/unblocked-specification/agent/browser/IViewport';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import IDeviceProfile from '@ulixee/unblocked-specification/plugin/IDeviceProfile';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import IHeroMeta from '@ulixee/hero-interfaces/IHeroMeta';
import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';
import IScriptInvocationMeta from '@ulixee/hero-interfaces/IScriptInvocationMeta';

export default class SessionTable extends SqliteTable<ISessionRecord> {
  private id: string;
  private heroMeta: IHeroMeta;

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
        ['windowNavigatorPlatform', 'TEXT'],
        ['uaClientHintsPlatformVersion', 'TEXT'],
        ['startDate', 'INTEGER'],
        ['closeDate', 'INTEGER'],
        ['scriptVersion', 'TEXT'],
        ['scriptRunId', 'TEXT'],
        ['scriptRuntime', 'TEXT'],
        ['workingDirectory', 'TEXT'],
        ['scriptEntrypoint', 'TEXT'],
        ['scriptEntrypointFunction', 'TEXT'],
        ['scriptExecPath', 'TEXT'],
        ['scriptExecArgv', 'TEXT'],
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

  public getHeroMeta(): IHeroMeta {
    if (this.heroMeta) return this.heroMeta;
    const {
      id: sessionId,
      proxyIp,
      publicIp,
      createSessionOptions,
      name,
      viewport,
      locale,
      timezoneId,
      userAgentString,
      operatingSystemName,
      uaClientHintsPlatformVersion,
      windowNavigatorPlatform,
      operatingSystemVersion,
      browserName,
      browserFullVersion,
      renderingEngine,
      renderingEngineVersion,
    } = this.get();

    this.id ??= sessionId;
    this.heroMeta = <IHeroMeta>{
      sessionId,
      ...createSessionOptions,
      viewport,
      locale,
      timezoneId,
      sessionName: name,
      upstreamProxyIpMask: {
        proxyIp,
        publicIp,
      },
      renderingEngine,
      renderingEngineVersion,
      userAgentString,
      operatingSystemName,
      uaClientHintsPlatformVersion,
      windowNavigatorPlatform,
      operatingSystemVersion,
      browserName,
      browserFullVersion,
    };
    return this.heroMeta;
  }

  public insert(
    configuration: IHeroMeta,
    startDate: number,
    scriptInvocationMeta: IScriptInvocationMeta,
    deviceProfile: IDeviceProfile,
    createSessionOptions: Omit<ISessionCreateOptions, keyof IHeroMeta>,
  ): void {
    this.id = configuration.sessionId;
    const record = [
      configuration.sessionId,
      configuration.sessionName,
      configuration.browserName,
      configuration.browserFullVersion,
      configuration.operatingSystemName,
      configuration.operatingSystemVersion,
      configuration.renderingEngine,
      configuration.renderingEngineVersion,
      configuration.windowNavigatorPlatform,
      configuration.uaClientHintsPlatformVersion,
      startDate,
      null,
      scriptInvocationMeta?.version,
      scriptInvocationMeta?.runId,
      scriptInvocationMeta?.runtime,
      scriptInvocationMeta?.workingDirectory,
      scriptInvocationMeta?.entrypoint,
      scriptInvocationMeta?.entryFunction,
      scriptInvocationMeta?.execPath,
      scriptInvocationMeta?.execArgv ? JSON.stringify(scriptInvocationMeta.execArgv) : null,
      configuration.userAgentString,
      JSON.stringify(configuration.viewport),
      TypeSerializer.stringify(deviceProfile),
      configuration.timezoneId,
      configuration.locale,
      configuration.upstreamProxyIpMask?.publicIp,
      configuration.upstreamProxyIpMask?.proxyIp,
      TypeSerializer.stringify(createSessionOptions),
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
    this.heroMeta = null;

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
    if (!record) return null;
    record.createSessionOptions = TypeSerializer.parse(record.createSessionOptions as string);
    record.viewport = JSON.parse((record.viewport as any) ?? 'undefined');
    record.deviceProfile = TypeSerializer.parse((record.deviceProfile as any) ?? 'undefined');
    record.scriptExecArgv = JSON.parse((record.scriptExecArgv as any) ?? '[]');
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
  scriptVersion: string;
  scriptRunId: string;
  scriptRuntime: string;
  workingDirectory: string;
  scriptEntrypoint: string;
  scriptEntrypointFunction: string;
  scriptExecPath: string;
  scriptExecArgv: string[];
  userAgentString: string;
  windowNavigatorPlatform: string;
  uaClientHintsPlatformVersion: string;
  viewport: IViewport;
  timezoneId: string;
  locale: string;
  publicIp?: string;
  proxyIp?: string;
  deviceProfile: IDeviceProfile;
  createSessionOptions: ISessionCreateOptions;
}
