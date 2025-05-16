import { Database as SqliteDatabase } from 'better-sqlite3';
import IViewport from '@ulixee/unblocked-specification/agent/browser/IViewport';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import IDeviceProfile from '@ulixee/unblocked-specification/plugin/IDeviceProfile';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import IHeroMeta from '@ulixee/hero-interfaces/IHeroMeta';
import IScriptInvocationMeta from '@ulixee/hero-interfaces/IScriptInvocationMeta';
export default class SessionTable extends SqliteTable<ISessionRecord> {
    private id;
    private heroMeta;
    constructor(db: SqliteDatabase);
    getHeroMeta(): IHeroMeta;
    insert(configuration: IHeroMeta, startDate: number, scriptInvocationMeta: IScriptInvocationMeta, deviceProfile: IDeviceProfile, createSessionOptions: Omit<ISessionCreateOptions, keyof IHeroMeta>): void;
    updateConfiguration(configuration: IHeroMeta): void;
    close(closeDate: number): void;
    get(): ISessionRecord;
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
    scriptProductId: string;
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
