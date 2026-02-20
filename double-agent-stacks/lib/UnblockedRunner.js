"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseRunner_1 = require("./BaseRunner");
class UnblockedRunner extends BaseRunner_1.default {
    constructor(agent, page) {
        super();
        this.hasNavigated = false;
        this.agent = agent;
        agent.browserContext.resources.keepResourceBodies = true;
        this.page = page;
    }
    async runPage(assignment, sessionPage, step) {
        if (sessionPage.isRedirect)
            return;
        if (!this.hasNavigated || sessionPage.url !== this.page.mainFrame.url) {
            console.log('%s GOTO -- %s', step, sessionPage.url);
            const resource = await this.page.goto(sessionPage.url);
            console.log('%s Waiting for statusCode -- %s', step, sessionPage.url);
            const statusCode = resource.response.statusCode;
            if (statusCode >= 400) {
                console.log(`${statusCode} ERROR: `, resource.response.buffer?.toString());
                console.log(sessionPage.url);
                process.exit();
            }
        }
        this.hasNavigated = true;
        console.log('%s waitForPaintingStable -- %s', step, sessionPage.url);
        await this.page.waitForLoad('PaintingStable');
        if (sessionPage.waitForElementSelector) {
            console.log('%s waitForElementSelector -- %s', step, sessionPage.waitForElementSelector);
            await wait(async () => {
                const visibility = await this.page.mainFrame.jsPath.getNodeVisibility([
                    'document',
                    ['querySelector', sessionPage.waitForElementSelector],
                ]);
                if (visibility.isVisible)
                    return true;
            }, { timeoutMs: 60e3, loopDelayMs: 100 });
        }
        if (sessionPage.clickElementSelector) {
            console.log('%s Wait for clickElementSelector -- %s', step, sessionPage.clickElementSelector);
            await wait(async () => {
                const visibility = await this.page.mainFrame.jsPath.getNodeVisibility([
                    'document',
                    ['querySelector', sessionPage.clickElementSelector],
                ]);
                if (visibility.isVisible)
                    return true;
            }, { timeoutMs: 30e3, loopDelayMs: 100 });
            console.log('%s Click -- %s', step, sessionPage.clickElementSelector);
            await this.page.click(sessionPage.clickElementSelector);
            await this.page.mainFrame.waitForLocation('change');
            await this.page.mainFrame.waitForLoad();
            console.log('%s Location Changed -- %s', step, sessionPage.url);
        }
    }
    async stop() {
        await this.agent.close();
    }
}
exports.default = UnblockedRunner;
function wait(callbackFn, options = {}) {
    options.timeoutMs ??= 30e3;
    const end = Date.now() + options.timeoutMs;
    return new Promise(async (resolve) => {
        while (Date.now() <= end) {
            const isComplete = await callbackFn();
            if (isComplete) {
                resolve(true);
                return;
            }
            if (options.loopDelayMs) {
                await delay(options.loopDelayMs);
            }
        }
        resolve(false);
    });
}
function delay(millis) {
    return new Promise((resolve) => setTimeout(resolve, millis));
}
//# sourceMappingURL=UnblockedRunner.js.map