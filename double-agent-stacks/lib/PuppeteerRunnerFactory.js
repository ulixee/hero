"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = require("puppeteer");
const PuppeteerRunner_1 = require("./PuppeteerRunner");
class PuppeteerRunnerFactory {
    runnerId() {
        return 'puppeteer';
    }
    async startFactory() {
        this.browser = await (0, puppeteer_1.launch)({
            headless: true,
            acceptInsecureCerts: true,
        });
    }
    async spawnRunner(assignment) {
        const browserContext = await this.browser.createBrowserContext();
        const page = await browserContext.newPage();
        await page.setUserAgent(assignment.userAgentString);
        return new PuppeteerRunner_1.default(page);
    }
    async stopFactory() {
        await this.browser.close();
    }
}
exports.default = PuppeteerRunnerFactory;
//# sourceMappingURL=PuppeteerRunnerFactory.js.map