"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = runBrowserstack;
require("../env");
const fs_1 = require("fs");
const Path = require("path");
const getAllPlugins_1 = require("@double-agent/collect/lib/getAllPlugins");
const p_queue_1 = require("p-queue");
const fileUtils_1 = require("@ulixee/commons/lib/fileUtils");
const real_user_agents_1 = require("@ulixee/real-user-agents");
const ShutdownHandler_1 = require("@ulixee/commons/lib/ShutdownHandler");
const index_1 = require("../index");
const SeleniumRunners_1 = require("../lib/SeleniumRunners");
const BrowserStack_1 = require("../lib/BrowserStack");
const baseDomsDir = Path.resolve(index_1.default.profiledDoms, 'browserstack');
const tmpDir = Path.resolve(index_1.default.profiledDoms, '.tmp');
// clean up tmp dir
if ((0, fs_1.existsSync)(tmpDir))
    (0, fs_1.rmSync)(tmpDir, { recursive: true });
const runners = new SeleniumRunners_1.default();
const features = 'headed-selenium';
const browserDomPlugin = (0, getAllPlugins_1.default)().find(x => x.id === 'browser-dom-environment');
async function runBrowserstack() {
    let totalCount = 0;
    const queue = new p_queue_1.default({ concurrency: 5 });
    ShutdownHandler_1.default.register(() => {
        queue.clear();
    });
    for (const userAgentId of index_1.default.userAgentIds) {
        const { browserId, operatingSystemId } = index_1.default.extractMetaFromUserAgentId(userAgentId);
        const operatingSystem = real_user_agents_1.default.getOperatingSystem(operatingSystemId);
        const browser = real_user_agents_1.default.getBrowser(browserId);
        if (!browser) {
            console.log('RealUserAgents is missing browser: ', operatingSystemId, browserId);
            continue;
        }
        if (browser.name === 'Firefox' && Number(browser.version.major) < 100)
            continue;
        // TODO: The dom environment plugin hangs <= 94. Need to investigate for scraper report eventually
        if (browser.name === 'Chrome' && Number(browser.version.major) < 125)
            continue;
        if (browser.name === 'Edge' && Number(browser.version.major) < 95)
            continue;
        if (browser.name === 'Safari' && Number(browser.version.major) < 13)
            continue;
        // no support for Promises, lambdas... detections need refactor for support
        if (browser.name === 'IE')
            continue;
        // 1. Does this need to run? Clean up as needed.
        const domDir = Path.join(baseDomsDir, `${userAgentId}--${features}`);
        if (await (0, fileUtils_1.existsAsync)(domDir)) {
            const filesCount = (await fs_1.promises.readdir(domDir)).length;
            if (filesCount >= browserDomPlugin.outputFiles * 2) {
                console.log(`FOUND ${userAgentId}--${features}... skipping`);
                continue;
            }
            else {
                console.log(`FOUND CORRUPTED ${userAgentId}--${features}... REDOING`, {
                    filesCount,
                    expected: browserDomPlugin.outputFiles * 2,
                });
                // clean dir
                // await Fs.rm(domDir, { recursive: true });
            }
        }
        await fs_1.promises.mkdir(domDir, { recursive: true });
        const browserStackAgent = await BrowserStack_1.default.createAgent(operatingSystem, browser);
        if (!browserStackAgent)
            continue;
        void queue.add(createSecondDomProfile.bind(this, browserStackAgent, userAgentId, domDir));
        totalCount += 1;
    }
    console.log(`${totalCount} queued, wait for complete`, queue.size, queue.pending);
    await queue.onIdle();
    console.log(''.padEnd(100, '-'));
    console.log(`${totalCount} browser profiles`);
    console.log(''.padEnd(100, '-'));
}
async function createSecondDomProfile(agent, userAgentId, domDir) {
    const tmpFilesDir = Path.join(tmpDir, userAgentId);
    const didSucceed = await runners.singleAssignment(agent, userAgentId, {
        rerunPluginIds: [browserDomPlugin.id],
        downloadDir: tmpFilesDir,
        userId: `${userAgentId}-doms`,
    });
    if (!didSucceed)
        return;
    // 1. Symlink-in starting profiles
    const profilesDir = index_1.default.userAgentDir(userAgentId);
    for (const profileFileName of await fs_1.promises.readdir(profilesDir)) {
        if (profileFileName.startsWith(browserDomPlugin.id)) {
            const sourcePath = Path.join(profilesDir, profileFileName);
            const destPath = Path.join(domDir, profileFileName.replace('.json.gz', '--1.json.gz'));
            const relativeSourcePath = Path.relative(domDir, sourcePath);
            if (await (0, fileUtils_1.existsAsync)(destPath)) {
                await fs_1.promises.unlink(destPath);
            }
            await fs_1.promises.symlink(relativeSourcePath, destPath);
        }
    }
    // 2. Copy the newly generated profile files into the browserstack doms dir
    for (const tmpFileName of await fs_1.promises.readdir(tmpFilesDir)) {
        const destFileName = tmpFileName.replace('.json.gz', `--2.json.gz`);
        if (await (0, fileUtils_1.existsAsync)(`${domDir}/${destFileName}`)) {
            await fs_1.promises.unlink(`${domDir}/${destFileName}`);
        }
        await fs_1.promises.rename(`${tmpFilesDir}/${tmpFileName}`, `${domDir}/${destFileName}`);
    }
    await fs_1.promises.rm(tmpFilesDir, { recursive: true }).catch(() => null);
}
//# sourceMappingURL=runBrowserstackDoms.js.map