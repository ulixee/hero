"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SqliteTable_1 = require("@ulixee/commons/lib/SqliteTable");
const TypeSerializer_1 = require("@ulixee/commons/lib/TypeSerializer");
class SessionTable extends SqliteTable_1.default {
    constructor(db) {
        super(db, 'Session', [
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
            ['scriptProductId', 'TEXT'],
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
        ], true);
    }
    getHeroMeta() {
        if (this.heroMeta)
            return this.heroMeta;
        const { id: sessionId, proxyIp, publicIp, createSessionOptions, name, viewport, locale, timezoneId, userAgentString, operatingSystemName, uaClientHintsPlatformVersion, windowNavigatorPlatform, operatingSystemVersion, browserName, browserFullVersion, renderingEngine, renderingEngineVersion, } = this.get();
        this.id ??= sessionId;
        this.heroMeta = {
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
    insert(configuration, startDate, scriptInvocationMeta, deviceProfile, createSessionOptions) {
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
            scriptInvocationMeta?.productId,
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
            TypeSerializer_1.default.stringify(deviceProfile),
            configuration.timezoneId,
            configuration.locale,
            configuration.upstreamProxyIpMask?.publicIp,
            configuration.upstreamProxyIpMask?.proxyIp,
            TypeSerializer_1.default.stringify(createSessionOptions),
        ];
        this.insertNow(record);
    }
    updateConfiguration(configuration) {
        const toUpdate = {
            viewport: JSON.stringify(configuration.viewport),
            timezoneId: configuration.timezoneId,
            locale: configuration.locale,
            publicIp: configuration.upstreamProxyIpMask?.publicIp,
            proxyIp: configuration.upstreamProxyIpMask?.proxyIp,
        };
        this.heroMeta = null;
        this.db
            .prepare(`UPDATE ${this.tableName} SET viewport=:viewport, timezoneId=:timezoneId, locale=:locale, publicIp=:publicIp, proxyIp=:proxyIp WHERE id=?`)
            .run(this.id, toUpdate);
        if (this.insertCallbackFn)
            this.insertCallbackFn([]);
    }
    close(closeDate) {
        const values = [closeDate, this.id];
        const fields = ['closeDate'];
        const sql = `UPDATE ${this.tableName} SET ${fields.map(n => `${n}=?`).join(', ')} WHERE id=?`;
        this.db.prepare(sql).run(...values);
        if (this.insertCallbackFn)
            this.insertCallbackFn([]);
    }
    get() {
        const record = this.db.prepare(`select * from ${this.tableName}`).get();
        if (!record)
            return null;
        record.createSessionOptions = TypeSerializer_1.default.parse(record.createSessionOptions);
        record.viewport = JSON.parse(record.viewport ?? 'undefined');
        record.deviceProfile = TypeSerializer_1.default.parse(record.deviceProfile ?? 'undefined');
        record.scriptExecArgv = JSON.parse(record.scriptExecArgv ?? '[]');
        return record;
    }
}
exports.default = SessionTable;
//# sourceMappingURL=SessionTable.js.map