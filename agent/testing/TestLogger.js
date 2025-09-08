"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Logger_1 = require("@ulixee/commons/lib/Logger");
const Callsite_1 = require("@ulixee/commons/lib/Callsite");
const Path = require("path");
const Fs = require("fs");
const util_1 = require("util");
const env_1 = require("./env");
let isDevtoolsLogging = false;
try {
    const envDebug = process.env.DEBUG ?? '';
    if (envDebug.includes('ulx:*') ||
        envDebug.includes('ulx*') ||
        envDebug === '*' ||
        envDebug.includes('devtools')) {
        isDevtoolsLogging = true;
    }
}
catch (e) { }
const logLevels = { stats: 0, info: 1, warn: 2, error: 3 };
let logId = 0;
class TestLogger {
    constructor(outPath, module, boundContext) {
        this.outPath = outPath;
        this.level = env_1.default.isLogDebug ? 'stats' : 'error';
        this.boundContext = {};
        this.module = module ? extractPathFromModule(module) : '';
        if (boundContext)
            this.boundContext = boundContext;
        if (this.module.includes('DevtoolsSessionLogger') && isDevtoolsLogging) {
            this.level = 'stats';
        }
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
    flush() {
        // no-op
    }
    createChild(module, boundContext) {
        return new TestLogger(this.outPath, module, boundContext);
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
        const timestamp = new Date().toISOString();
        const { error, printData } = (0, Logger_1.translateToPrintable)(logData);
        const params = Object.keys(printData).length ? [printData] : [];
        if (error)
            params.push(error);
        Fs.appendFileSync(`${this.outPath}-${TestLogger.testNumber}.jsonl`, `${JSON.stringify({
            timestamp,
            level,
            path: this.module,
            action,
            params,
        })}\n`);
        if (logLevels[level] >= logLevels[this.level]) {
            // eslint-disable-next-line no-console
            console.log(`${timestamp} ${level.toUpperCase()} [${this.module}] ${action}`, ...params.map(x => (0, util_1.inspect)(x, false, null, env_1.default.useLogColors)));
        }
        return id;
    }
    static forTest(module) {
        const entrypoint = Callsite_1.default.getEntrypoint();
        const path = entrypoint.split(Path.sep);
        const testName = path.slice(-3).join('-').replace('.test.js', '');
        if (!Fs.existsSync(env_1.default.dataDir))
            Fs.mkdirSync(env_1.default.dataDir, { recursive: true });
        return new TestLogger(`${env_1.default.dataDir}/${testName}`, module);
    }
}
TestLogger.testNumber = 0;
exports.default = TestLogger;
function extractPathFromModule(module) {
    const fullPath = typeof module === 'string' ? module : module.filename || module.id || '';
    return fullPath
        .replace('.js', '')
        .replace('.ts', '')
        .replace(/^(.*)[/\\]agent[/\\](.+)$/, '$2')
        .replace(/^.*[/\\]build[/\\](.+)$/, '$1');
}
//# sourceMappingURL=TestLogger.js.map