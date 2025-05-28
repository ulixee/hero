"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = runBrowserstack;
exports.cleanProfiles = cleanProfiles;
require("../env");
const p_queue_1 = require("p-queue");
const config_1 = require("@double-agent/config");
const real_user_agents_1 = require("@ulixee/real-user-agents");
const getAllPlugins_1 = require("@double-agent/collect/lib/getAllPlugins");
const ShutdownHandler_1 = require("@ulixee/commons/lib/ShutdownHandler");
const index_1 = require("../index");
const BrowserStack_1 = require("../lib/BrowserStack");
const SeleniumRunners_1 = require("../lib/SeleniumRunners");
// configure plugins to re-run
async function runBrowserstack() {
    index_1.default.init();
    const runners = new SeleniumRunners_1.default();
    let totalCount = 0;
    const queue = new p_queue_1.default({ concurrency: 5 });
    ShutdownHandler_1.default.register(() => {
        queue.clear();
        queue.pause();
    });
    const plugins = (0, getAllPlugins_1.default)();
    console.log('RUNNING X ACTIVE PLUGINS', plugins.length);
    for (const agent of real_user_agents_1.default.all()) {
        const userAgentId = (0, config_1.createUserAgentIdFromIds)(agent.operatingSystemId, agent.browserId);
        const operatingSystem = real_user_agents_1.default.getOperatingSystem(agent.operatingSystemId);
        const browser = real_user_agents_1.default.getBrowser(agent.browserId);
        if (!browser) {
            console.log('RealUserAgents is missing browser: ', agent.operatingSystemId, agent.browserId);
            continue;
        }
        // too old for the double agent suite
        if (browser.name === 'Firefox' && Number(browser.version.major) < 100)
            continue;
        // TODO: The dom environment plugin hangs <= 94. Need to investigate for scraper report eventually
        if (browser.name === 'Chrome' && Number(browser.version.major) < 121)
            continue;
        if (browser.name === 'Edge' && Number(browser.version.major) < 95)
            continue;
        if (browser.name === 'Safari' && Number(browser.version.major) < 13)
            continue;
        // no support for Promises, lambdas... detections need refactor for support
        if (browser.name === 'IE')
            continue;
        const rerunPluginIds = index_1.default.findMissingPlugins(userAgentId, plugins);
        if (!rerunPluginIds.length)
            continue;
        console.log('RERUNNING PLUGINS', { rerunPluginIds, userAgentId });
        const browserStackAgent = await BrowserStack_1.default.createAgent(operatingSystem, browser);
        if (!browserStackAgent)
            continue;
        void queue.add(runners.singleAssignment.bind(runners, browserStackAgent, userAgentId, { rerunPluginIds }));
        totalCount += 1;
    }
    await queue.onIdle();
    console.log(''.padEnd(100, '-'));
    console.log(`${totalCount} browser profiles`);
    console.log(''.padEnd(100, '-'));
}
function cleanProfiles() {
    const removePluginIds = process.argv[1]?.split(',')?.map(x => x.trim()) ?? [];
    console.log('REMOVING plugin-ids', removePluginIds);
    // remove files of plugins we want to rerun, comment this out on subsequent runs
    if (removePluginIds.length) {
        index_1.default.cleanPluginProfiles(removePluginIds);
    }
}
//# sourceMappingURL=runBrowserstack.js.map