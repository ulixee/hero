"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("@ulixee/unblocked-agent-testing/index");
const Os = require("os");
const index_2 = require("../index");
const BrowserLaunchError_1 = require("../errors/BrowserLaunchError");
afterEach(index_1.Helpers.afterEach);
afterAll(index_1.Helpers.afterAll);
beforeEach(async () => {
    index_1.TestLogger.testNumber += 1;
});
describe('launchProcess', () => {
    it('should reject all promises when browser is closed', async () => {
        const browserEngine = { ...index_1.BrowserUtils.defaultBrowserEngine };
        const browser = new index_2.Browser(browserEngine);
        index_1.Helpers.needsClosing.push(browser);
        await browser.launch();
        const logger = index_1.TestLogger.forTest(module);
        const context = await browser.newContext({ logger });
        const page = await context.newPage();
        let error = null;
        const neverResolves = page.evaluate(`new Promise(r => {})`).catch(e => (error = e));
        await page.evaluate(`new Promise(f => setTimeout(f, 0))`);
        await browser.close();
        await neverResolves;
        expect(error.message).toContain('Cancel Pending Promise');
    });
    it('should reject if executable path is invalid', async () => {
        const browserEngine = { ...index_1.BrowserUtils.defaultBrowserEngine };
        browserEngine.executablePath = 'random-invalid-path';
        const browser = new index_2.Browser(browserEngine);
        index_1.Helpers.needsClosing.push(browser);
        await expect(browser.launch()).rejects.toThrow('Failed to launch');
    });
    it('should be callable twice', async () => {
        const browser = new index_2.Browser(index_1.BrowserUtils.browserEngineOptions);
        index_1.Helpers.needsClosing.push(browser);
        await browser.launch();
        await Promise.all([browser.close(), browser.close()]);
        await expect(browser.close()).resolves.toBe(undefined);
    });
    it('should throw a friendly error if its headed and there is no xserver on linux running', async () => {
        if (Os.platform() !== 'linux')
            return;
        process.env.REMOTE = undefined;
        const browser = new index_2.Browser({ ...index_1.BrowserUtils.browserEngineOptions, launchArguments: [] }, {}, { showChrome: true });
        index_1.Helpers.needsClosing.push(browser);
        const error = await browser.launch().catch(e => e);
        expect(error).toBeInstanceOf(BrowserLaunchError_1.default);
        if (browser.majorVersion > 97) {
            expect(error.stack).toMatch(/Looks like you launched Headed Chrome without an XServer running./);
            expect(error.stack).toMatch(/xvfb-run/);
        }
    });
});
//# sourceMappingURL=BrowserProcess.test.js.map