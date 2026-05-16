"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ShutdownHandler_1 = require("@ulixee/commons/lib/ShutdownHandler");
const SeleniumRunner_1 = require("@ulixee/double-agent-stacks/lib/SeleniumRunner");
const AssignmentsClient_1 = require("@double-agent/runner/lib/AssignmentsClient");
const BrowserStack_1 = require("./BrowserStack");
const index_1 = require("../index");
class SeleniumRunners {
    constructor() {
        this.runners = new Set();
        ShutdownHandler_1.default.register(() => Promise.allSettled([...this.runners].map(x => x.stop())));
    }
    async singleAssignment(agent, userAgentId, options = {}) {
        options.downloadDir ??= index_1.default.userAgentDir(userAgentId);
        const { userId, rerunPluginIds, downloadDir } = options;
        const client = new AssignmentsClient_1.default(userId ?? userAgentId);
        let runner;
        try {
            const assignment = await client.createSingleUserAgentIdAssignment(userAgentId);
            console.log('Running agent [%s]', userAgentId, agent);
            const driver = await BrowserStack_1.default.buildWebDriver(agent);
            if (!driver)
                return false;
            const runnerOptions = SeleniumRunner_1.default.getRunnerOptions(agent.browser, agent.browser_version);
            runner = new SeleniumRunner_1.default(driver, runnerOptions);
            this.runners.add(runner);
            await runner.run(assignment, { onlyRunPluginIds: rerunPluginIds });
            console.log(`DOWNLOADING ${userAgentId} to ${downloadDir}`);
            await client.downloadAssignmentProfiles(assignment.id, downloadDir);
            return true;
        }
        catch (error) {
            console.log('ERROR Running Agent %s', userAgentId, error);
            return false;
        }
        finally {
            this.runners.delete(runner);
            await runner?.stop().catch(() => null);
        }
    }
}
exports.default = SeleniumRunners;
//# sourceMappingURL=SeleniumRunners.js.map