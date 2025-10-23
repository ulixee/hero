"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const unblocked_agent_1 = require("@ulixee/unblocked-agent");
const default_human_emulator_1 = require("@ulixee/default-human-emulator");
const default_browser_emulator_1 = require("@ulixee/default-browser-emulator");
const UnblockedRunner_1 = require("./UnblockedRunner");
class UnblockedRunnerFactory {
    constructor() {
        this.pool = new unblocked_agent_1.Pool({
            plugins: [default_browser_emulator_1.default, default_human_emulator_1.default],
        });
    }
    runnerId() {
        return 'unblocked-agent';
    }
    async startFactory() {
        await this.pool.start();
    }
    async spawnRunner(assignment) {
        const { operatingSystemName, operatingSystemVersion, browserName, browserVersion } = assignment.browserMeta;
        const agent = this.pool.createAgent({
            customEmulatorConfig: {
                userAgentSelector: `~ ${operatingSystemName} = ${operatingSystemVersion} & ${browserName} = ${browserVersion}`,
            },
        });
        const page = await agent.newPage();
        return new UnblockedRunner_1.default(agent, page);
    }
    async stopFactory() {
        await this.pool.close();
    }
}
exports.default = UnblockedRunnerFactory;
//# sourceMappingURL=UnblockedRunnerFactory.js.map