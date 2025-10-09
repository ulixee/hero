"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const unblocked_agent_testing_1 = require("@ulixee/unblocked-agent-testing");
const browserUtils_1 = require("@ulixee/unblocked-agent-testing/browserUtils");
const index_1 = require("../index");
const server_1 = require("./server");
describe('Page.popups', () => {
    let server;
    let page;
    let browser;
    let context;
    const needsClosing = [];
    beforeAll(async () => {
        server = await server_1.TestServer.create(0);
        browser = new index_1.Browser(browserUtils_1.browserEngineOptions);
        await browser.launch();
        const hooks = new browserUtils_1.PageHooks({
            locale: 'en-GB',
            userAgent: 'popupcity',
            osPlatform: 'Windows95',
        });
        const logger = unblocked_agent_testing_1.TestLogger.forTest(module);
        context = await browser.newContext({ logger });
        context.hooks = hooks;
        context.on('page', event => {
            needsClosing.push(event.page);
        });
    });
    afterEach(async () => {
        await page.close();
        for (const close of needsClosing) {
            await close.close();
        }
        needsClosing.length = 0;
    });
    beforeEach(async () => {
        unblocked_agent_testing_1.TestLogger.testNumber += 1;
        page = await context.newPage();
        server.reset();
    });
    afterAll(async () => {
        await server.stop();
        await context.close();
        await browser.close();
    });
    describe('Popup tests', () => {
        // TODO remove or fix popups
        it('should focus popups by default', async () => {
            server.setRoute('/empty.html', (req, res) => {
                res.end(`<a href="${server.emptyPage}" target="_blank">Click me</a>`);
            });
            await page.goto(server.emptyPage);
            const popupPromise = waitForPopup(page);
            await page.click('a');
            const popup = await popupPromise;
            needsClosing.push(popup);
            expect(await popup.evaluate('document.hasFocus()')).toBe(true);
            expect(await page.evaluate('document.hasFocus()')).toBe(true);
        });
        it('should initialize popups with all context information', async () => {
            server.setRoute('/empty.html', (req, res) => {
                res.end(`<a href="${server.emptyPage}" target="_blank">Click me</a>`);
            });
            await page.goto(server.emptyPage);
            expect(await page.evaluate(`navigator.userAgent`)).toBe('popupcity');
            expect(await page.evaluate(`navigator.platform`)).toBe('Windows95');
            expect(await page.evaluate(`navigator.languages`)).toStrictEqual(['en-GB']);
            const popupPromise = waitForPopup(page);
            await page.click('a');
            const popup = await popupPromise;
            needsClosing.push(popup);
            expect(await popup.evaluate(`navigator.userAgent`)).toBe('popupcity');
            expect(await popup.evaluate(`navigator.platform`)).toBe('Windows95');
        });
        it('should be able to capture concurrent popup navigations', async () => {
            const concurrent = new Array(5).fill(0).map(async () => {
                let newPage;
                let popup;
                try {
                    newPage = await context.newPage();
                    await newPage.goto(server.url('popup.html'));
                    const popupNavigate = waitForPopup(newPage);
                    await newPage.click('a');
                    popup = await popupNavigate;
                    await popup.mainFrame.waitForLoad({ loadStatus: 'AllContentLoaded' });
                    expect(popup.mainFrame.url).toBe(server.emptyPage);
                }
                finally {
                    await popup?.close();
                    await newPage.close();
                }
            });
            await Promise.all(concurrent);
        });
    });
});
async function waitForPopup(page) {
    return new Promise(resolve => {
        page.popupInitializeFn = async (popup) => resolve(popup);
    });
}
//# sourceMappingURL=Page.popups.test.js.map