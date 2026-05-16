"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Callsite_1 = require("@ulixee/commons/lib/Callsite");
const objectUtils_1 = require("@ulixee/commons/lib/objectUtils");
const scriptInstanceVersion = Date.now().toString();
let counter = 0;
let runtimeDefaults;
class ScriptInvocationMeta {
    static getScriptInvocationMeta(defaults = {}) {
        runtimeDefaults ??= {
            version: scriptInstanceVersion,
            workingDirectory: process.cwd(),
            entrypoint: Callsite_1.default.getEntrypoint(),
            runtime: 'node',
            execPath: process.execPath,
            execArgv: process.execArgv,
        };
        const result = {
            ...runtimeDefaults,
            ...(0, objectUtils_1.filterUndefined)(defaults),
        };
        if (!result.runId)
            result.runId = String(counter++);
        return result;
    }
}
exports.default = ScriptInvocationMeta;
//# sourceMappingURL=ScriptInvocationMeta.js.map