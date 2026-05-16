"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasBeenLoggedSymbol = exports.loggerSessionIdNames = exports.LogEvents = exports.Log = void 0;
exports.translateToPrintable = translateToPrintable;
exports.default = logger;
exports.injectLogger = injectLogger;
exports.registerNamespaceMapping = registerNamespaceMapping;
// eslint-disable-next-line max-classes-per-file
const util_1 = require("util");
const hasBeenLoggedSymbol = Symbol.for('UlxHasBeenLogged');
exports.hasBeenLoggedSymbol = hasBeenLoggedSymbol;
global.UlxLogFilters ??= {
    envValue: null,
    active: [],
    skip: [],
    namespaces: { active: new Set(), inactive: new Set() },
    enabledNamesCache: {},
};
const logFilters = global.UlxLogFilters;
let logId = 0;
class Log {
    constructor(module, boundContext) {
        this.useColors = process.env.NODE_DISABLE_COLORS !== 'true' && process.env.NODE_DISABLE_COLORS !== '1';
        this.boundContext = {};
        this.logtimeById = {};
        this.module = module ? extractPathFromModule(module) : '';
        if (boundContext)
            this.boundContext = boundContext;
        this.level = isEnabled(this.module) ? 'stats' : 'error';
    }
    stats(action, data) {
        return this.log('stats', action, data);
    }
    info(action, data) {
        return this.log('info', action, data);
    }
    warn(action, data) {
        return this.log('warn', action, data);
    }
    error(action, data) {
        return this.log('error', action, data);
    }
    createChild(module, boundContext) {
        const Constructor = this.constructor;
        // @ts-ignore
        return new Constructor(module, {
            ...this.boundContext,
            ...boundContext,
        });
    }
    flush() {
        // no-op
    }
    logToConsole(level, entry) {
        const printablePath = entry.module.replace('.js', '').replace('.ts', '').replace('build/', '');
        const { error, printData } = translateToPrintable(entry.data);
        if (level === 'warn' || level === 'error') {
            printData.sessionId = entry.sessionId;
            printData.sessionName = loggerSessionIdNames.get(entry.sessionId) ?? undefined;
        }
        const params = Object.keys(printData).length ? [printData] : [];
        if (error)
            params.push(error);
        const millisAddon = entry.millis ? ` ${entry.millis}ms` : '';
        // eslint-disable-next-line no-console
        console.log(`${entry.timestamp.toISOString()} ${entry.level.toUpperCase()} [${printablePath}] ${entry.action}${millisAddon}`, ...params.map(x => (0, util_1.inspect)(x, false, null, this.useColors)));
    }
    log(level, action, data) {
        let logData;
        let sessionId = this.boundContext.sessionId;
        let parentId;
        const mergedData = { ...data, context: this.boundContext };
        if (mergedData) {
            for (const [key, val] of Object.entries(mergedData)) {
                if (key === 'parentLogId')
                    parentId = val;
                else if (key === 'sessionId')
                    sessionId = val;
                else {
                    if (!logData)
                        logData = {};
                    logData[key] = val;
                }
            }
        }
        logId += 1;
        const id = logId;
        const timestamp = new Date();
        const now = timestamp.getTime();
        const startTime = parentId ? this.logtimeById[parentId] : now;
        this.logtimeById[id] = now;
        const entry = {
            id,
            sessionId,
            parentId,
            timestamp,
            millis: now - startTime,
            action,
            data: logData,
            level,
            module: this.module,
        };
        if (logLevels[level] >= logLevels[this.level]) {
            this.logToConsole(level, entry);
        }
        LogEvents.broadcast(entry);
        return id;
    }
}
exports.Log = Log;
function translateValueToPrintable(key, value, depth = 0) {
    if (value === undefined || value === null)
        return;
    if (key === 'password' || key === 'suri') {
        return '********';
    }
    if (value instanceof Error) {
        return value.toString();
    }
    if (value instanceof RegExp) {
        return `/${value.source}/${value.flags}`;
    }
    if (value instanceof BigInt || typeof value === 'bigint') {
        return `${value.toString()}n`;
    }
    if (Buffer.isBuffer(value)) {
        if (value.length <= 256)
            return `b64\\${value.toString('base64')}`;
        return `<Buffer: ${value.byteLength} bytes>`;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return value;
    }
    if (depth > 2)
        return value;
    if (value.toJSON) {
        return value.toJSON();
    }
    if (typeof value === 'object') {
        if (Array.isArray(value)) {
            return value.map((x, i) => translateValueToPrintable(i, x, depth + 1));
        }
        const result = {};
        for (const [subKey, subValue] of Object.entries(value)) {
            result[subKey] = translateValueToPrintable(subKey, subValue, depth + 1);
        }
        return result;
    }
}
function translateToPrintable(data, result) {
    result ??= { printData: {} };
    const { printData } = result;
    for (const [key, value] of Object.entries(data)) {
        if (value instanceof Error) {
            Object.defineProperty(value, hasBeenLoggedSymbol, {
                enumerable: false,
                value: true,
            });
            result.error = value;
            continue;
        }
        if (key === 'error') {
            if (typeof value === 'object') {
                const { message, ...rest } = value;
                result.error = new Error(message);
                if ('stack' in value)
                    result.error.stack = value.stack;
                if ('name' in value)
                    result.error.name = value.name;
                Object.assign(result.error, rest);
            }
            else if (typeof value === 'string') {
                result.error = new Error(value);
            }
            continue;
        }
        const printable = translateValueToPrintable(key, value);
        if (printable === null || printable === undefined)
            continue;
        printData[key] = printable;
    }
    return result;
}
const logLevels = { stats: 0, info: 1, warn: 2, error: 3 };
if (!global.UlixeeLogCreator) {
    global.UlixeeLogCreator = (module) => {
        const log = new Log(module);
        // This code ensures a single version of Log is used across all @ulixee/commons that are loaded into memory.
        // We don't update it if an injected logger is used.
        global.UlxLogPrototype ??= Log.prototype;
        Object.setPrototypeOf(log, global.UlxLogPrototype);
        return {
            log,
        };
    };
}
function logger(module) {
    return global.UlixeeLogCreator(module);
}
global.UlxLoggerSessionIdNames ??= new Map();
global.UlxSubscriptions ??= new Map();
const loggerSessionIdNames = global.UlxLoggerSessionIdNames;
exports.loggerSessionIdNames = loggerSessionIdNames;
class LogEvents {
    static unsubscribe(subscriptionId) {
        global.UlxSubscriptions.delete(subscriptionId);
    }
    static subscribe(onLogFn) {
        const id = global.UlxSubscriptions.size + 1;
        global.UlxSubscriptions.set(id, onLogFn);
        return id;
    }
    static broadcast(entry) {
        for (const sub of global.UlxSubscriptions.values()) {
            sub(entry);
        }
    }
}
exports.LogEvents = LogEvents;
global.UlixeeLogInstances ??= { Log, LogEvents };
function injectLogger(builder) {
    global.UlixeeLogCreator = builder;
}
const moduleNamesByPath = {};
function extractPathFromModule(module) {
    const fullPath = typeof module === 'string' ? module : module.filename || module.id || '';
    if (!moduleNamesByPath[fullPath]) {
        moduleNamesByPath[fullPath] = fullPath
            .replace(/^(.*)[/\\]unblocked[/\\](.+)$/, '$2')
            .replace(/^(.*)[/\\]ulixee[/\\](.+)$/, '$2')
            .replace(/^(.*)[/\\]@ulixee[/\\](.+)$/, '$2')
            .replace(/^(.*)[/\\]commons[/\\](.+)$/, '$2')
            .replace(/^.*[/\\]packages[/\\](.+)$/, '$1');
    }
    return moduleNamesByPath[fullPath];
}
/// LOG FILTERING //////////////////////////////////////////////////////////////////////////////////////////////////////
function registerNamespaceMapping(filter = process.env.DEBUG) {
    if (logFilters.envValue === filter)
        return;
    logFilters.envValue = filter;
    filter ??= '';
    const { active, skip } = logFilters;
    active.length = 0;
    skip.length = 0;
    logFilters.namespaces.active.clear();
    logFilters.namespaces.inactive.clear();
    logFilters.enabledNamesCache = {};
    const split = filter.split(/[\s,]+/).map(x => x.trim());
    for (const part of split) {
        if (!part)
            continue;
        if (part[0] === '-') {
            logFilters.namespaces.inactive.add(part.slice(1));
        }
        else {
            logFilters.namespaces.active.add(part);
            if (part === 'ulx*' || part === 'ulx:*')
                logFilters.namespaces.active.add('*');
        }
    }
    for (const ns of logFilters.namespaces.active) {
        if (ns.includes('ulx:*') || ns.includes('ulx*') || ns === '*') {
            active.push(/.*/);
        }
        else if (ns === 'ulx') {
            active.push(/hero[/-].*/, /agent\/.*/, /plugins\/.*/, /net\/.*/, /cloud\/.*/, /datastore[/-].*/, /broker\/.*/);
            skip.push(/desktop[/-]?.*/, /DevtoolsSessionLogger/);
        }
        else if (ns.includes('ulx:desktop')) {
            active.push(/desktop[/-]?.*/);
        }
        else if (ns.includes('ulx:mitm')) {
            active.push(/agent[/-]mitm.*/);
        }
        else if (ns.includes('ulx:devtools')) {
            active.push(/DevtoolsSessionLogger/);
        }
        else if (ns.includes('hero')) {
            active.push(/^hero[/-].*/, /net\/.*/);
        }
        else if (ns.includes('datastore')) {
            active.push(/^datastore[/-].*/, /net\/.*/);
        }
    }
}
function isEnabled(modulePath) {
    if (process.env.ULX_DEBUG === '1' ||
        process.env.ULX_DEBUG === 'true' ||
        process.env.ULX_DEBUG === '*')
        return true;
    registerNamespaceMapping(process.env.DEBUG);
    if (modulePath in logFilters.enabledNamesCache)
        return logFilters.enabledNamesCache[modulePath];
    if (logFilters.namespaces.active.has('*'))
        return true;
    for (const ns of logFilters.skip) {
        if (ns.test(modulePath)) {
            logFilters.enabledNamesCache[modulePath] = false;
            return false;
        }
    }
    for (const ns of logFilters.active) {
        if (ns.test(modulePath)) {
            logFilters.enabledNamesCache[modulePath] = true;
            return true;
        }
    }
    logFilters.enabledNamesCache[modulePath] = false;
    return false;
}
//# sourceMappingURL=Logger.js.map