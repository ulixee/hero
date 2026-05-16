"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseRunner_1 = require("./BaseRunner");
class PuppeteerRunner extends BaseRunner_1.default {
    constructor(page) {
        super();
        this.hasNavigated = false;
        this.page = page;
    }
    async runPage(assignment, page, step) {
        if (page.isRedirect)
            return;
        if (!this.hasNavigated || page.url !== this.page.url()) {
            console.log('%s GOTO -- %s', step, page.url);
            const response = await this.page.goto(page.url, {
                waitUntil: 'domcontentloaded',
            });
            console.log('%s Waiting for statusCode -- %s', step, page.url);
            const statusCode = await response.status();
            if (statusCode >= 400) {
                console.log(`${statusCode} ERROR: `, await response.text());
                console.log(page.url);
                process.exit();
            }
        }
        this.hasNavigated = true;
        if (page.waitForElementSelector) {
            console.log('%s waitForElementSelector -- %s', step, page.waitForElementSelector);
            await this.page.waitForSelector(page.waitForElementSelector, {
                visible: true,
                timeout: 60e3,
            });
        }
        if (page.clickElementSelector) {
            console.log('%s Wait for clickElementSelector -- %s', step, page.clickElementSelector);
            const clickable = await this.page.waitForSelector(page.clickElementSelector, {
                visible: true,
            });
            console.log('%s Click -- %s', step, page.clickElementSelector);
            await clickable.click();
            await this.page.waitForNavigation();
            console.log('%s Location Changed -- %s', step, page.url);
        }
    }
    async stop() {
        await this.page.close();
    }
}
exports.default = PuppeteerRunner;
//# sourceMappingURL=PuppeteerRunner.js.map