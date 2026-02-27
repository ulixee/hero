"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const browserUtils_1 = require("@ulixee/unblocked-agent-testing/browserUtils");
const index_1 = require("@ulixee/unblocked-agent-testing/index");
const index_2 = require("../index");
const _pageTestUtils_1 = require("./_pageTestUtils");
const server_1 = require("./server");
describe('Frames Out of Process', () => {
    let server;
    let page;
    let browser;
    let context;
    beforeAll(async () => {
        server = await server_1.TestServer.create(0);
        browser = new index_2.Browser(browserUtils_1.browserEngineOptions, {
            onNewBrowser(b) {
                b.engine.launchArguments.push('--site-per-process', '--host-rules=MAP * 127.0.0.1');
            },
        });
        await browser.launch();
        const logger = index_1.TestLogger.forTest(module);
        context = await browser.newContext({ logger });
    });
    afterEach(async () => {
        await page.close().catch(() => null);
        server.reset();
    });
    beforeEach(async () => {
        index_1.TestLogger.testNumber += 1;
        page = await context.newPage();
    });
    afterAll(async () => {
        await server.stop();
        await context.close().catch(() => null);
        await browser.close();
    });
    it('should treat OOP iframes and normal iframes the same', async () => {
        await page.goto(server.emptyPage);
        const framePromise = page.waitOn('frame-navigated', ({ frame }) => {
            return frame.url.endsWith('/empty.html');
        });
        await (0, _pageTestUtils_1.attachFrame)(page, 'frame1', server.emptyPage);
        await (0, _pageTestUtils_1.attachFrame)(page, 'frame2', `${server.crossProcessBaseUrl}/empty.html`);
        await framePromise;
        expect(page.frames.filter(x => x.parentId === page.mainFrame.id)).toHaveLength(2);
    });
    it('should track navigations within OOP iframes', async () => {
        await page.goto(server.emptyPage);
        const framePromise = page.waitOn('frame-navigated', ({ frame }) => {
            return frame.url === `${server.crossProcessBaseUrl}/empty.html`;
        });
        await (0, _pageTestUtils_1.attachFrame)(page, 'frame1', `${server.crossProcessBaseUrl}/empty.html`);
        const { frame } = await framePromise;
        expect(frame.url).toContain('/empty.html');
        await (0, _pageTestUtils_1.navigateFrame)(page, 'frame1', `${server.crossProcessBaseUrl}/assets/frame.html`);
        expect(frame.url).toContain('/assets/frame.html');
    });
    it('should support OOP iframes becoming normal iframes again', async () => {
        await page.goto(server.emptyPage);
        const framePromise = page.waitOn('frame-created');
        await (0, _pageTestUtils_1.attachFrame)(page, 'frame1', server.emptyPage);
        const { frame } = await framePromise;
        expect(frame.isOopif()).toBe(false);
        await (0, _pageTestUtils_1.navigateFrame)(page, 'frame1', `${server.crossProcessBaseUrl}/empty.html`);
        expect(frame.isOopif()).toBe(true);
        await (0, _pageTestUtils_1.navigateFrame)(page, 'frame1', server.emptyPage);
        expect(frame.isOopif()).toBe(false);
        expect(page.frames).toHaveLength(2);
    });
    it('should support frames within OOP frames', async () => {
        await page.goto(server.emptyPage);
        const frame1Promise = page.waitOn('frame-navigated', ({ frame }) => {
            return frame.url === `${server.crossProcessBaseUrl}/frames/one-frame.html`;
        });
        const frame2Promise = page.waitOn('frame-navigated', ({ frame }) => {
            return frame.url === `${server.crossProcessBaseUrl}/frames/frame.html`;
        });
        await (0, _pageTestUtils_1.attachFrame)(page, 'frame1', `${server.crossProcessBaseUrl}/frames/one-frame.html`);
        const [{ frame: frame1 }, { frame: frame2 }] = await Promise.all([
            frame1Promise,
            frame2Promise,
        ]);
        expect(await frame1.evaluate(`document.location.href`)).toMatch(/one-frame\.html$/);
        expect(await frame2.evaluate(`document.location.href`)).toMatch(/frames\/frame\.html$/);
    });
    it('should support OOP iframes getting detached', async () => {
        await page.goto(server.emptyPage);
        const framePromise = page.waitOn('frame-created');
        await (0, _pageTestUtils_1.attachFrame)(page, 'frame1', server.emptyPage);
        const { frame } = await framePromise;
        expect(frame.isOopif()).toBe(false);
        await (0, _pageTestUtils_1.navigateFrame)(page, 'frame1', `${server.crossProcessBaseUrl}/empty.html`);
        expect(frame.isOopif()).toBe(true);
        await (0, _pageTestUtils_1.detachFrame)(page, 'frame1');
        if (browser.majorVersion >= 109)
            expect(page.frames).toHaveLength(1);
    });
    it('should support wait for navigation for transitions from local to OOPIF', async () => {
        await page.goto(server.emptyPage);
        const framePromise = page.waitOn('frame-created');
        await (0, _pageTestUtils_1.attachFrame)(page, 'frame1', server.emptyPage);
        const { frame } = await framePromise;
        expect(frame.isOopif()).toBe(false);
        const nav = frame.waitForLoad({ loadStatus: 'JavascriptReady' });
        await (0, _pageTestUtils_1.navigateFrame)(page, 'frame1', `${server.crossProcessBaseUrl}/empty.html`);
        await nav;
        expect(frame.isOopif()).toBe(true);
        await (0, _pageTestUtils_1.detachFrame)(page, 'frame1');
        if (browser.majorVersion >= 109)
            expect(page.frames).toHaveLength(1);
    });
    it('should keep track of a frames OOP state', async () => {
        await page.goto(server.emptyPage);
        const framePromise = page.waitOn('frame-created');
        await (0, _pageTestUtils_1.attachFrame)(page, 'frame1', `${server.crossProcessBaseUrl}/empty.html`);
        const { frame } = await framePromise;
        expect(frame.url).toContain('/empty.html');
        await (0, _pageTestUtils_1.navigateFrame)(page, 'frame1', server.emptyPage);
        expect(frame.url).toBe(server.emptyPage);
    });
    it('should support evaluating in oop iframes', async () => {
        await page.goto(server.emptyPage);
        const framePromise = page.waitOn('frame-created');
        await (0, _pageTestUtils_1.attachFrame)(page, 'frame1', `${server.crossProcessBaseUrl}/empty.html`);
        const { frame } = await framePromise;
        await frame.evaluate(`(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      _test = 'Test 123!';
    })()`);
        const result = await frame.evaluate(`(()  => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return window._test;
    })()`);
        expect(result).toBe('Test 123!');
    });
    it('should provide access to elements', async () => {
        await page.goto(server.emptyPage);
        const framePromise = page.waitOn('frame-created');
        await (0, _pageTestUtils_1.attachFrame)(page, 'frame1', `${server.crossProcessBaseUrl}/empty.html`);
        const { frame } = await framePromise;
        await frame.evaluate(`(() => {
      const button = document.createElement('button');
      button.id = 'test-button';
      button.innerText = 'click';
      button.onclick = () => {
        button.id = 'clicked';
      };
      document.body.appendChild(button);
    })()`);
        await page.evaluate(`(() => {
      document.body.style.border = '150px solid black';
      document.body.style.margin = '250px';
      document.body.style.padding = '50px';
    })()`);
        await (0, _pageTestUtils_1.waitForVisible)(frame, '#test-button');
        await frame.click('#test-button');
        await expect((0, _pageTestUtils_1.waitForVisible)(frame, '#clicked')).resolves.toBeTruthy();
    });
    it('should report oopif frames', async () => {
        context.targetsById.clear();
        const frame = page.waitOn('frame-navigated', event => {
            return event.frame.url.endsWith('/oopif.html');
        });
        await page.goto(`${server.baseUrl}/dynamic-oopif.html`);
        await frame;
        expect([...context.targetsById.values()].filter(x => x.type === 'iframe')).toHaveLength(1);
        expect(page.frames.length).toBe(2);
    });
    it('should wait for inner OOPIFs', async () => {
        context.targetsById.clear();
        await page.goto(`http://mainframe:${server.port}/main-frame.html`);
        const { frame: frame2 } = await page.waitOn('frame-navigated', x => {
            return x.frame.url.endsWith('inner-frame2.html');
        });
        expect([...context.targetsById.values()].filter(x => x.type === 'iframe')).toHaveLength(2);
        expect(page.frames.filter(frame => {
            return frame.isOopif();
        }).length).toBe(2);
        await frame2.waitForLoad({ loadStatus: 'DomContentLoaded' });
        if (browser.majorVersion > 98) {
            expect(await frame2.evaluate(`document.querySelectorAll('button').length`)).toStrictEqual(1);
        }
    });
    it('should support frames within OOP iframes', async () => {
        const oopIframePromise = page.waitOn('frame-navigated', ({ frame }) => {
            return frame.url.endsWith('/oopif.html');
        });
        await page.goto(`${server.baseUrl}/dynamic-oopif.html`);
        const { frame: oopIframe } = await oopIframePromise;
        await (0, _pageTestUtils_1.attachFrame)(oopIframe, 'frame1', `${server.crossProcessBaseUrl}/empty.html`);
        const frame1 = oopIframe.childFrames[0];
        expect(frame1.url).toMatch(/empty.html$/);
        await (0, _pageTestUtils_1.navigateFrame)(oopIframe, 'frame1', `${server.crossProcessBaseUrl}/oopif.html`);
        expect(frame1.url).toMatch(/oopif.html$/);
        await frame1.evaluate(`location.href= "${server.crossProcessBaseUrl}/oopif.html#navigate-within-document"`);
        await frame1.waitForLoad({ loadStatus: 'AllContentLoaded' });
        expect(frame1.url).toMatch(/oopif.html#navigate-within-document$/);
        await (0, _pageTestUtils_1.detachFrame)(oopIframe, 'frame1');
        await new Promise(setImmediate);
        expect(oopIframe.childFrames).toHaveLength(0);
    });
    it('clickablePoint, boundingBox, boxModel should work for elements inside OOPIFs', async () => {
        await page.goto(server.emptyPage);
        const framePromise = page.waitOn('frame-created');
        await (0, _pageTestUtils_1.attachFrame)(page, 'frame1', `${server.crossProcessBaseUrl}/empty.html`);
        const { frame } = await framePromise;
        await page.evaluate(`(() => {
      document.body.style.border = '50px solid black';
      document.body.style.margin = '50px';
      document.body.style.padding = '50px';
    })()`);
        await frame.evaluate(`(() => {
      const button = document.createElement('button');
      button.id = 'test-button';
      button.innerText = 'click';
      document.body.appendChild(button);
    })()`);
        const visibility = await (0, _pageTestUtils_1.waitForVisible)(frame, '#test-button');
        const containerOffset = await frame.getContainerOffset();
        const result = visibility.boundingClientRect;
        expect(result.x + containerOffset.x).toBeGreaterThan(150); // padding + margin + border left
        expect(result.y + containerOffset.y).toBeGreaterThan(150); // padding + margin + border top
    });
});
//# sourceMappingURL=Frames.oopif.test.js.map