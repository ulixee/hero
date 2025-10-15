"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CorePlugin_1 = require("@ulixee/hero-plugin-utils/lib/CorePlugin");
const { name: pluginId } = require('../package.json');
class ExecuteJsCorePlugin extends CorePlugin_1.default {
    async onClientCommand({ frame, page }, args) {
        const { fnName, fnSerialized, isolateFromWebPageEnvironment } = args;
        frame ??= page.mainFrame;
        const result = await frame.evaluate(fnSerialized, {
            isolateFromWebPageEnvironment,
            includeCommandLineAPI: true,
        });
        if (result?.error) {
            this.logger.error(fnName, { error: result.error });
            throw new Error(result.error);
        }
        else {
            return result;
        }
    }
}
ExecuteJsCorePlugin.id = pluginId;
exports.default = ExecuteJsCorePlugin;
//# sourceMappingURL=CorePlugin.js.map