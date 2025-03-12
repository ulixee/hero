"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const selenium_webdriver_1 = require("selenium-webdriver");
const BaseRunner_1 = require("./BaseRunner");
class SeleniumRunner extends BaseRunner_1.default {
    constructor(driver, options) {
        super();
        this.driver = driver;
        this.hasNavigated = false;
        this.needsEnterKey = false;
        this.needsErrorPageChecks = false;
        this.needsEnterKey = options.needsEnterKey ?? false;
        this.needsErrorPageChecks = options.needsErrorPageChecks ?? false;
    }
    async runPage(assignment, page, step) {
        const driver = this.driver;
        let currentUrl = await this.driver.getCurrentUrl();
        if (page.isRedirect)
            return;
        // selenium has to wait for page urls
        if (!!this.lastPage?.clickElementSelector && currentUrl !== page.url) {
            // edge 18 takes forever to test codecs.. so need to wait a long time for page to load
            console.log(`URL ${currentUrl} SHOULD BE ${page.url}`);
            await driver.wait(selenium_webdriver_1.until.urlIs(page.url), 60e3);
            currentUrl = await driver.getCurrentUrl();
        }
        this.lastPage = page;
        if (page.url !== currentUrl) {
            console.log('%s GOTO -- %s', step, page.url);
            await driver.get(page.url);
        }
        this.hasNavigated = true;
        if (await this.checkErrorPage(page, currentUrl)) {
            console.log('%s ERROR on url -- %s', step, page.url);
            return;
        }
        if (page.waitForElementSelector) {
            console.log('%s waitForElementSelector -- %s on %s', step, page.waitForElementSelector, page.url);
            await this.waitForElement(page.waitForElementSelector);
        }
        else {
            console.log('%s waitForBody -- %s on %s', step, page.url);
            await this.waitForElement('body');
        }
        if (page.clickElementSelector) {
            console.log('%s clickElementSelector -- %s on %s', step, page.clickElementSelector, page.url);
            const elem = await this.waitForElement(page.clickElementSelector);
            await driver.wait(selenium_webdriver_1.until.elementIsVisible(elem));
            await this.clickElement(elem);
        }
    }
    async stop() {
        await this.driver?.quit();
    }
    async checkErrorPage(page, currentUrl) {
        if (this.needsErrorPageChecks && (await this.isSafariErrorPage(page.url))) {
            console.log('Safari error page encountered %s (was %s)', page.url, currentUrl);
            this.lastPage = null;
            return true;
        }
        return false;
    }
    async isSafariErrorPage(url) {
        try {
            const errorText = await this.driver.findElement(selenium_webdriver_1.By.css('.error-title')).getText();
            if (errorText === 'Safari Can’t Open the Page') {
                console.log("Safari couldn't load page! NOTE: This flow is now broken, need to go back to get Safari functional!!", url);
                await this.driver.navigate().back();
                return true;
            }
        }
        catch (err) { }
        return false;
    }
    waitForElement(cssSelector) {
        return this.driver.wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.css(cssSelector)));
    }
    async clickElement(elem) {
        if (this.needsEnterKey) {
            // safari 13.0 has a known bug where clicks don't work that's making this necessary
            await this.driver.actions().move({ origin: elem }).click(elem).perform();
            try {
                await elem.click();
            }
            catch (error) {
                console.log('Error: could not click');
            }
            try {
                await elem.sendKeys(selenium_webdriver_1.Key.RETURN);
            }
            catch (error) {
                console.log('Error: could not sendKeys');
            }
        }
        else {
            await elem.click();
        }
    }
    static getRunnerOptions(browserName, browserVersion) {
        const [browserMajor, browserMinor] = browserVersion.split(/[.-]/).map(Number);
        const options = { needsEnterKey: false, needsErrorPageChecks: false };
        if (browserName.toLowerCase() === 'safari') {
            options.needsEnterKey = browserMajor === 13 && browserMinor === 0;
            options.needsErrorPageChecks = browserMajor === 12 && browserMinor === 1;
        }
        return options;
    }
    static async createDriver(url, capabilities) {
        return await new selenium_webdriver_1.Builder().usingServer(url).withCapabilities(capabilities).build();
    }
}
exports.default = SeleniumRunner;
//# sourceMappingURL=SeleniumRunner.js.map