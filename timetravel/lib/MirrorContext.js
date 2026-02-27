"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Logger_1 = require("@ulixee/commons/lib/Logger");
const hero_core_1 = require("@ulixee/hero-core");
const CorePlugins_1 = require("@ulixee/hero-core/lib/CorePlugins");
const { log } = (0, Logger_1.default)(module);
class MirrorContext {
    static async createFromSessionDb(sessionId, core, headed = true) {
        const options = await hero_core_1.Session.restoreOptionsFromSessionRecord({}, sessionId, core);
        delete options.resumeSessionId;
        delete options.resumeSessionStartLocation;
        options.showChromeInteractions = headed;
        options.showChrome = headed;
        const logger = log.createChild(module, { sessionId });
        const agent = core.pool.createAgent({
            options,
            logger,
            deviceProfile: options?.userProfile?.deviceProfile,
            id: sessionId,
        });
        const _ = new CorePlugins_1.default(agent, {
            getSessionSummary() {
                return {
                    id: sessionId,
                    options,
                };
            },
        }, core.corePluginsById);
        return await agent.open();
    }
}
exports.default = MirrorContext;
//# sourceMappingURL=MirrorContext.js.map