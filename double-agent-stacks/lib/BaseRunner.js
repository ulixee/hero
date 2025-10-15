"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ShutdownHandler_1 = require("@ulixee/commons/lib/ShutdownHandler");
let isShuttingDown = false;
ShutdownHandler_1.default.register(() => {
    isShuttingDown = true;
});
class BaseRunner {
    constructor() {
        this.isFirst = true;
    }
    async run(assignment, filters) {
        try {
            console.log('--------------------------------------');
            console.log('STARTING ', assignment.id, assignment.userAgentString);
            let counter = 1;
            // eslint-disable-next-line prefer-const
            for (let [pluginId, pages] of Object.entries(assignment.pagesByPlugin)) {
                if (filters?.onlyRunPluginIds && !filters?.onlyRunPluginIds.includes(pluginId)) {
                    console.log('SKIPPING: ', pluginId);
                    continue;
                }
                for (const page of pages) {
                    if (isShuttingDown) {
                        console.log('SHUTTING DOWN, skipping remaining steps');
                        return;
                    }
                    this.currentPage = page;
                    const step = `[${assignment.sessionId}.${counter}]`;
                    await this.runPage(assignment, page, step);
                    this.isFirst = false;
                    counter += 1;
                }
            }
            console.log(`[%s.✔] FINISHED ${assignment.id}`, assignment.sessionId);
        }
        catch (err) {
            console.log('[%s.x] Error on %s', assignment.sessionId, this.currentPage?.url, err);
            throw err;
        }
        console.log('--------------------------------------');
    }
}
exports.default = BaseRunner;
//# sourceMappingURL=BaseRunner.js.map