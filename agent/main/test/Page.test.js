"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const image_size_1 = require("image-size");
const unblocked_agent_testing_1 = require("@ulixee/unblocked-agent-testing");
const browserUtils_1 = require("@ulixee/unblocked-agent-testing/browserUtils");
const server_1 = require("./server");
const index_1 = require("../index");
const _pageTestUtils_1 = require("./_pageTestUtils");
describe('Pages', () => {
    let server;
    let page;
    let browser;
    let context;
    const needsClosing = [];
    beforeAll(async () => {
        const hooks = new browserUtils_1.PageHooks();
        server = await server_1.TestServer.create(0);
        browser = new index_1.Browser(browserUtils_1.browserEngineOptions, hooks);
        await browser.launch();
        const logger = unblocked_agent_testing_1.TestLogger.forTest(module);
        context = await browser.newContext({ logger });
        context.hooks = hooks;
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
    describe('basic', () => {
        it('should reject all promises when page is closed', async () => {
            const newPage = await context.newPage();
            let error = null;
            await Promise.all([
                newPage.evaluate(`new Promise(r => {})`).catch(e => (error = e)),
                newPage.close(),
            ]);
            expect(error.message).toContain('Cancel Pending');
        });
        // TODO re-enable once we support console logging
        it.failing('should run beforeunload', async () => {
            const waitForConsole = page.waitOn('console', event => {
                return event.message === 'Before called';
            });
            await page.goto(server.url('beforeunload.html'));
            // We have to interact with a page so that 'beforeunload' handlers
            // fire.
            await page.click('div');
            const mainFrameId = page.mainFrame.frameId;
            await page.close();
            const message = await waitForConsole;
            await expect(message.message).toBe('Before called');
            await expect(message.frameId).toBe(mainFrameId);
        });
        it('page.close should set the page close state', async () => {
            const newPage = await context.newPage();
            expect(newPage.isClosed).toBe(false);
            await newPage.close();
            expect(newPage.isClosed).toBe(true);
        });
        it('page.close should be callable twice', async () => {
            const newPage = await context.newPage();
            await Promise.all([newPage.close(), newPage.close()]);
            await expect(newPage.close()).resolves.not.toBeTruthy();
        });
        it('page.url should work', async () => {
            expect(page.mainFrame.url).toBe('about:blank');
            await page.goto(server.emptyPage);
            expect(page.mainFrame.url).toBe(server.emptyPage);
        });
        it('page.url should include hashes', async () => {
            await page.goto(`${server.emptyPage}#hash`);
            expect(page.mainFrame.url).toBe(`${server.emptyPage}#hash`);
            await Promise.all([
                page.evaluate(`window.location.hash = 'dynamic';`),
                page.mainFrame.waitOn('frame-navigated', event => {
                    return event.navigatedInDocument;
                }),
            ]);
            expect(page.mainFrame.url).toBe(`${server.emptyPage}#dynamic`);
        });
        // TODO: popups don't open, so refactor test or remove
        it.failing('page.close should work with window.close', async () => {
            const newPagePromise = new Promise(resolve => {
                page.popupInitializeFn = async (page1) => {
                    resolve(page1);
                };
            });
            await page.evaluate(`(() => {
  window.newPage = window.open('about:blank');
})()`);
            const newPage = await newPagePromise;
            const closedPromise = newPage.waitOn('close');
            await page.evaluate(`window.newPage.close()`);
            await expect(closedPromise).resolves.toBe(undefined);
        });
        it('page.close should work with page.close', async () => {
            const newPage = await context.newPage();
            const closedPromise = newPage.waitOn('close');
            await newPage.close();
            await expect(closedPromise).resolves.toBe(undefined);
        });
        it('should think that it is focused by default', async () => {
            expect(await page.evaluate('document.hasFocus()')).toBe(true);
        });
        it('should think that all pages are focused', async () => {
            const page2 = await context.newPage();
            needsClosing.push(page2);
            expect(await page.evaluate('document.hasFocus()')).toBe(true);
            expect(await page2.evaluate('document.hasFocus()')).toBe(true);
            await page2.close();
        });
    });
    describe('addNewDocumentScript', () => {
        it('should evaluate before anything else on the page', async () => {
            await page.addNewDocumentScript(`window.injected = 123;`, false);
            await page.goto(server.url('tamperable.html'));
            await page.mainFrame.waitForLoad({ loadStatus: 'DomContentLoaded' });
            expect(await page.evaluate('window.result')).toBe(123);
        });
        it('should support multiple scripts', async () => {
            await page.addNewDocumentScript(`window.script1 = 1;`, false);
            await page.addNewDocumentScript(`window.script2 = 2;`, false);
            await page.goto(server.url('tamperable.html'));
            await page.mainFrame.waitForLoad({ loadStatus: 'DomContentLoaded' });
            expect(await page.evaluate('window.script1')).toBe(1);
            expect(await page.evaluate('window.script2')).toBe(2);
        });
        it('should work with CSP', async () => {
            server.setCSP('/empty.html', `script-src ${server.baseUrl}`);
            await page.addNewDocumentScript(`window.injected = 123;`, false);
            await page.goto(server.emptyPage);
            await page.mainFrame.waitForLoad({ loadStatus: 'DomContentLoaded' });
            expect(await page.evaluate('window.injected')).toBe(123);
        });
        it('should work after a cross origin navigation', async () => {
            await page.goto(server.crossProcessBaseUrl);
            await page.addNewDocumentScript(`window.injected = 123;`, false);
            await page.goto(server.url('tamperable.html'));
            await page.mainFrame.waitForLoad({ loadStatus: 'DomContentLoaded' });
            expect(await page.evaluate('window.result')).toBe(123);
        });
    });
    // TODO re-enable once runtime or console domain is enabled...
    describe('console', () => {
        it.failing('should print out nested objects', async () => {
            const [message] = await Promise.all([
                page.waitOn('console'),
                page.evaluate(`console.log('hello', 5, { foo: 'bar' })`),
            ]);
            expect(message.message).toEqual(`hello 5 "{ foo: bar }"`);
        });
        it.failing('should emit same log twice', async () => {
            const messages = [];
            page.on('console', m => messages.push(m.message));
            await page.evaluate(`
    for (let i = 0; i < 2; ++i) console.log('hello');
  `);
            expect(messages).toEqual(['hello', 'hello']);
        });
    });
    describe('screenshots', () => {
        it('should be able to take a viewport screenshot', async () => {
            await (0, _pageTestUtils_1.setContent)(page, `<div style="height: 500px; width: 500px; background:blue">&nbsp;</div>
         <div style="height: 200px; width: 100px; background:red">&nbsp;</div>`);
            const screenshot = await page.screenshot({ format: 'png' });
            const viewport = await page.mainFrame.getWindowOffset();
            expect((0, image_size_1.default)(screenshot)).toStrictEqual({
                width: viewport.innerWidth,
                type: 'png',
                height: viewport.innerHeight,
            });
        });
        it('should screenshot only the visible page', async () => {
            await (0, _pageTestUtils_1.setContent)(page, `<div style="height: 5000px; width: 1px; background:green">&nbsp;</div>`);
            const screenshot = await page.screenshot({ format: 'jpeg', jpegQuality: 1 });
            const viewport = await page.mainFrame.getWindowOffset();
            expect((0, image_size_1.default)(screenshot)).toStrictEqual({
                width: viewport.innerWidth,
                type: 'jpg',
                height: viewport.innerHeight,
            });
        });
        it('should be able to take a clipped rect screenshot', async () => {
            await (0, _pageTestUtils_1.setContent)(page, `<div style="height: 500px; width: 500px; background:blue">&nbsp;</div>
         <div style="height: 200px; width: 100px; background:red">&nbsp;</div>`);
            const screenshot = await page.screenshot({
                format: 'png',
                rectangle: {
                    width: 500,
                    height: 500,
                    x: 0,
                    y: 0,
                    scale: 1,
                },
            });
            expect((0, image_size_1.default)(screenshot).height).toBe(500);
        });
        it('should be able to take a full page screenshot', async () => {
            await (0, _pageTestUtils_1.setContent)(page, `<style>body,div {margin:0;padding:0}</style>
         <div style="height: 2500px; width: 1px; background:blue">&nbsp;</div>
         <div style="height: 200px; width: 100px; background:red">&nbsp;</div>`);
            const screenshot = await page.screenshot({
                format: 'jpeg',
                jpegQuality: 1,
                fullPage: true,
            });
            expect((0, image_size_1.default)(screenshot).height).toBe(2700);
        });
        it('should be able to take a clipped rect screenshot outside of viewport', async () => {
            await (0, _pageTestUtils_1.setContent)(page, `<style>body,div {margin:0;padding:0}</style>
        <div style="height: 2500px; width: 50px;></div>
        <div style="height: 200px; width: 100px; background:red">&nbsp;</div>`);
            const screenshot = await page.screenshot({
                format: 'png',
                rectangle: {
                    width: 500,
                    height: 2700,
                    x: 0,
                    y: 0,
                    scale: 1,
                },
            });
            expect((0, image_size_1.default)(screenshot).height).toBe(2700);
        });
    });
    describe('crash', () => {
        it('should emit crash event when page crashes', async () => {
            page.navigate('chrome://crash').catch(() => { });
            await expect(page.waitOn('crashed')).resolves.toMatchObject({
                error: new Error('Target Crashed'),
            });
        });
    });
    describe('ensure no hanging', () => {
        it('clicking on links which do not commit navigation', async () => {
            await page.goto(server.emptyPage);
            await (0, _pageTestUtils_1.setContent)(page, `<a href='${server.emptyPage}'>foobar</a>`);
            await page.click('a');
            await expect(page.close()).resolves.toBe(undefined);
        });
        it('calling window.stop async', async () => {
            server.setRoute('/empty.html', async () => { });
            await expect(page.evaluate(`((url) => {
    window.location.href = url;
    setTimeout(() => window.stop(), 100);
  })('${server.emptyPage}')`)).resolves.toBe(undefined);
        });
        it('calling window.stop sync', async () => {
            await expect(page.evaluate(`(url => {
      window.location.href = url;
      window.stop();
    })('${server.emptyPage}')`)).resolves.toBe(undefined);
        });
        it('assigning location to about:blank', async () => {
            await page.goto(server.emptyPage);
            await expect(page.evaluate(`window.location.href = "about:blank";`)).resolves.toBe('about:blank');
        });
        it('assigning location to about:blank after non-about:blank', async () => {
            server.setRoute('/empty.html', async () => { });
            await expect(page.evaluate(`
    window.location.href = "${server.emptyPage}";
    window.location.href = "about:blank";`)).resolves.toBe('about:blank');
        });
        it('should work when subframe issues window.stop()', async () => {
            server.setRoute('/frames/style.css', () => { });
            const navigationPromise = page.goto(`${server.baseUrl}/frames/one-frame.html`);
            await page.waitOn('frame-created');
            const frame = page.frames[1];
            const loaded = page.mainFrame.waitOn('frame-lifecycle', ev => ev.name === 'load');
            await new Promise(resolve => {
                frame.on('frame-navigated', () => resolve());
            });
            await frame.evaluate(`window.stop()`);
            await expect(navigationPromise).resolves.toBeTruthy();
            await expect(loaded).resolves.toBeTruthy();
        });
    });
});
//# sourceMappingURL=Page.test.js.map