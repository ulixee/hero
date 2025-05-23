"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const browserUtils_1 = require("@ulixee/unblocked-agent-testing/browserUtils");
const index_1 = require("@ulixee/unblocked-agent-testing/index");
const index_2 = require("../index");
const Agent_1 = require("../lib/Agent");
const _pageTestUtils_1 = require("./_pageTestUtils");
const server_1 = require("./server");
describe('Frames', () => {
    let server;
    let page;
    let browser;
    let context;
    beforeAll(async () => {
        server = await server_1.TestServer.create(0);
        browser = new index_2.Browser(browserUtils_1.browserEngineOptions);
        await browser.launch();
        const logger = index_1.TestLogger.forTest(module);
        context = await browser.newContext({ logger });
    });
    afterEach(async () => {
        await page.close().catch(() => null);
        server.reset();
        await index_1.Helpers.afterEach();
    });
    beforeEach(async () => {
        index_1.TestLogger.testNumber += 1;
        page = await context.newPage();
    });
    afterAll(async () => {
        await server.stop();
        await context.close().catch(() => null);
        await browser.close();
        await index_1.Helpers.afterAll();
    });
    describe('basic', () => {
        it('should have different execution contexts', async () => {
            await page.goto(server.emptyPage);
            await page.waitForLoad('AllContentLoaded');
            await (0, _pageTestUtils_1.attachFrame)(page, 'frame1', server.emptyPage);
            expect(page.frames.length).toBe(2);
            await page.frames[0].evaluate(`(window.FOO = 'foo')`);
            await page.frames[1].evaluate(`(window.FOO = 'bar')`);
            expect(await page.frames[0].evaluate('window.FOO')).toBe('foo');
            expect(await page.frames[1].evaluate('window.FOO')).toBe('bar');
        });
        it('should not fetch context id for evaluate in mainframe', async () => {
            await page.goto(server.emptyPage);
            await page.waitForLoad('AllContentLoaded');
            const mainFrame = page.mainFrame;
            const spy = jest.spyOn(mainFrame, 'waitForContextId');
            await mainFrame.evaluate('window.location.href');
            expect(spy).toHaveBeenCalledTimes(0);
        });
        it('should have correct execution contexts', async () => {
            await page.goto(`${server.baseUrl}/frames/one-frame.html`);
            await page.waitForLoad('AllContentLoaded');
            expect(page.frames.length).toBe(2);
            expect(await page.frames[0].evaluate('document.body.textContent.trim()')).toBe('');
            expect(await page.frames[1].evaluate('document.body.textContent.trim()')).toBe(`Hi, I'm frame`);
        });
        it('should execute after cross-site navigation', async () => {
            await page.goto(server.emptyPage);
            await page.waitForLoad('AllContentLoaded');
            const mainFrame = page.mainFrame;
            expect(await mainFrame.evaluate('window.location.href')).toContain('localhost');
            await page.goto(`${server.crossProcessBaseUrl}/empty.html`);
            expect(await mainFrame.evaluate('window.location.href')).toContain('127');
        });
        it('should be isolated between frames', async () => {
            await page.goto(server.emptyPage);
            await page.waitForLoad('AllContentLoaded');
            await (0, _pageTestUtils_1.attachFrame)(page, 'frame1', server.emptyPage);
            expect(page.frames.length).toBe(2);
            const [frame1, frame2] = page.frames;
            expect(frame1 !== frame2).toBeTruthy();
            await Promise.all([frame1.evaluate('(window.a = 1)'), frame2.evaluate('(window.a = 2)')]);
            const [a1, a2] = await Promise.all([
                frame1.evaluate('window.a'),
                frame2.evaluate('window.a'),
            ]);
            expect(a1).toBe(1);
            expect(a2).toBe(2);
        });
        it('should be able to wait for JavascriptReady in a srcdoc frame', async () => {
            await page.goto(`${server.baseUrl}/frames/empty-frame.html`);
            await expect(page.waitForLoad('AllContentLoaded', { timeoutMs: 1000 })).resolves.toBeTruthy();
            await (0, _pageTestUtils_1.waitForExists)(page.mainFrame, '#frame1', 1000);
            if (page.frames.length === 1) {
                await page.waitOn('frame-created', ev => ev.frame.id === 'frame1', 2000);
            }
            await expect(page.frames[1].waitForLoad({ loadStatus: 'JavascriptReady', timeoutMs: 1000 })).resolves.toBeTruthy();
        });
        it('should work in iframes that failed initial navigation', async () => {
            // - Firefox does not report domcontentloaded for the iframe.
            // - Chromium and Firefox report empty url.
            // - Chromium does not report main/utility worlds for the iframe.
            await (0, _pageTestUtils_1.setContent)(page, `<meta http-equiv="Content-Security-Policy" content="script-src 'none';">
  <iframe src='javascript:""'></iframe>`);
            // Note: Chromium/Firefox never report 'load' event for the iframe.
            await page.evaluate(`(() => {
    const iframe = document.querySelector('iframe');
    const div = iframe.contentDocument.createElement('div');
    iframe.contentDocument.body.appendChild(div);
  })()`);
            expect(page.frames[1].url).toBe(undefined);
            // Main world should work.
            expect(await page.frames[1].evaluate('window.location.href')).toBe('about:blank');
        });
        it('should work in iframes that interrupted initial javascript url navigation', async () => {
            // Chromium does not report isolated world for the iframe.
            await page.goto(server.emptyPage);
            await page.evaluate(`(() => {
    const iframe = document.createElement('iframe');
    iframe.src = 'javascript:""';
    document.body.appendChild(iframe);
    iframe.contentDocument.open();
    iframe.contentDocument.write('<div>hello</div>');
    iframe.contentDocument.close();
  })()`);
            expect(await page.frames[1].evaluate('window.top.location.href')).toBe(server.emptyPage);
        });
    });
    describe('hierarchy', () => {
        it('should handle nested frames', async () => {
            await page.goto(`${server.baseUrl}/frames/nested-frames.html`);
            await page.waitForLoad('AllContentLoaded');
            expect(page.frames).toHaveLength(5);
            const mainFrame = page.mainFrame;
            expect(mainFrame.url).toMatch('nested-frames.html');
            const secondChildren = page.frames.filter(x => x.parentId === mainFrame.id);
            expect(secondChildren).toHaveLength(2);
            expect(secondChildren.map(x => x.url).sort()).toStrictEqual([
                `${server.baseUrl}/frames/frame.html`,
                `${server.baseUrl}/frames/two-frames.html`,
            ]);
            const secondParent = secondChildren.find(x => x.url.includes('two-frames'));
            const thirdTier = page.frames.filter(x => x.parentId === secondParent.id);
            expect(thirdTier).toHaveLength(2);
            await thirdTier[0].waitForNavigationLoader();
            expect(thirdTier[0].url).toMatch('frame.html');
            await thirdTier[1].waitForNavigationLoader();
            expect(thirdTier[1].url).toMatch('frame.html');
        });
        it('should send events when frames are manipulated dynamically', async () => {
            await page.goto(server.emptyPage);
            // validate framenavigated events
            const navigatedFrames = [];
            page.on('frame-created', ({ frame }) => {
                frame.on('frame-navigated', () => {
                    navigatedFrames.push({ frame });
                });
            });
            await (0, _pageTestUtils_1.attachFrame)(page, 'frame1', './assets/frame.html');
            expect(page.frames.length).toBe(2);
            expect(page.frames[1].url).toContain('/assets/frame.html');
            await page.evaluate(`(async () => {
        const frame = document.getElementById('frame1');
        frame.src = './empty.html';
        await new Promise(x => (frame.onload = x));
      })()`);
            expect(navigatedFrames.length).toBe(2);
            expect(navigatedFrames[1].frame.url).toBe(server.emptyPage);
            // validate framedetached events
            await page.evaluate(`document.getElementById('frame1').remove()`);
            expect(page.frames.length).toBe(1);
        });
        it('should persist mainFrame on cross-process navigation', async () => {
            await page.goto(server.emptyPage);
            await page.waitForLoad('AllContentLoaded');
            const mainFrame = page.mainFrame;
            await page.goto(`${server.crossProcessBaseUrl}/empty.html`);
            await page.waitForLoad('AllContentLoaded');
            expect(page.mainFrame === mainFrame).toBeTruthy();
        });
        it('should detach child frames on navigation', async () => {
            let navigatedFrames = [];
            page.mainFrame.on('frame-navigated', ev => navigatedFrames.push(ev));
            page.on('frame-created', ({ frame }) => {
                frame.on('frame-navigated', () => {
                    navigatedFrames.push(frame);
                });
            });
            await page.goto(`${server.baseUrl}/frames/nested-frames.html`);
            await page.waitForLoad('AllContentLoaded');
            expect(page.frames.length).toBe(5);
            for (const frame of page.frames)
                await frame.waitForNavigationLoader();
            expect(navigatedFrames.length).toBe(5);
            navigatedFrames = [];
            await page.goto(server.emptyPage);
            await page.waitForLoad('AllContentLoaded');
            expect(page.frames.length).toBe(1);
            expect(navigatedFrames.length).toBe(1);
        });
        it('should support framesets', async () => {
            let navigatedFrames = [];
            page.mainFrame.on('frame-navigated', ev => navigatedFrames.push(ev));
            page.on('frame-created', ({ frame }) => {
                frame.on('frame-navigated', () => {
                    navigatedFrames.push(frame);
                });
            });
            await page.goto(`${server.baseUrl}/frames/frameset.html`);
            await page.waitForLoad('AllContentLoaded');
            expect(page.frames.length).toBe(5);
            for (const frame of page.frames)
                await frame.waitForNavigationLoader();
            expect(navigatedFrames.length).toBe(5);
            navigatedFrames = [];
            await page.goto(server.emptyPage);
            expect(page.frames.length).toBe(1);
            expect(navigatedFrames.length).toBe(1);
        });
        it('should report frame from-inside shadow DOM', async () => {
            await page.goto(`${server.baseUrl}/shadow.html`);
            await page.waitForLoad('AllContentLoaded');
            await page.evaluate(`(async (url) => {
        const frame = document.createElement('iframe');
        frame.src = url;
        document.body.shadowRoot.appendChild(frame);
        await new Promise(x => (frame.onload = x));
      })('${server.emptyPage}')`);
            expect(page.frames.length).toBe(2);
            expect(page.frames[1].url).toBe(server.emptyPage);
        });
        it('should report frame.name', async () => {
            await (0, _pageTestUtils_1.attachFrame)(page, 'theFrameId', server.emptyPage);
            await page.evaluate(`((url) => {
        const frame = document.createElement('iframe');
        frame.name = 'theFrameName';
        frame.src = url;
        document.body.appendChild(frame);
        return new Promise(x => (frame.onload = x));
      })('${server.emptyPage}')`);
            expect(page.frames[0].name).toBe('');
            expect(page.frames[1].name).toBe('theFrameId');
            expect(page.frames[2].name).toBe('theFrameName');
        });
        it('should report frame.parentId', async () => {
            await (0, _pageTestUtils_1.attachFrame)(page, 'frame1', server.emptyPage);
            await (0, _pageTestUtils_1.attachFrame)(page, 'frame2', server.emptyPage);
            expect(page.frames[0].parentId).not.toBeTruthy();
            expect(page.frames[1].parentId).toBe(page.mainFrame.id);
            expect(page.frames[2].parentId).toBe(page.mainFrame.id);
        });
        it('should report different frame instance when frame re-attaches', async () => {
            const frame1 = await (0, _pageTestUtils_1.attachFrame)(page, 'frame1', server.emptyPage);
            expect(page.frames.length).toBe(2);
            await page.evaluate(`(() => {
        window.frame = document.querySelector('#frame1');
        window.frame.remove();
      })()`);
            // should have remove frame
            expect(page.frames.filter(x => x.id === frame1.id)).toHaveLength(0);
            const frame2Promise = page.waitOn('frame-created');
            await Promise.all([frame2Promise, page.evaluate('document.body.appendChild(window.frame)')]);
            expect((await frame2Promise).frame.id).not.toBe(frame1.id);
        });
        it('should refuse to display x-frame-options:deny iframe', async () => {
            server.setRoute('/x-frame-options-deny.html', async (req, res) => {
                res.setHeader('Content-Type', 'text/html');
                res.setHeader('X-Frame-Options', 'DENY');
                res.end(`<!DOCTYPE html><html><head><title>login</title></head><body style="background-color: red;"><p>dangerous login page</p></body></html>`);
            });
            await page.goto(server.emptyPage);
            await (0, _pageTestUtils_1.setContent)(page, `<iframe src="${server.crossProcessBaseUrl}/x-frame-options-deny.html"></iframe>`);
            expect(page.frames).toHaveLength(2);
            await new Promise(resolve => setTimeout(resolve, 1e3));
            expect(page.frames[1].url ?? '').not.toMatch('/x-frame-options-deny.html');
        });
    });
    describe('waiting', () => {
        it('should await navigation when clicking anchor', async () => {
            server.setRoute('/empty.html', async (req, res) => {
                res.setHeader('Content-Type', 'text/html');
                res.end(`<link rel='stylesheet' href='./one-style.css'>`);
            });
            await (0, _pageTestUtils_1.setContent)(page, `<a href="${server.emptyPage}">empty.html</a>`);
            const navigate = page.mainFrame.waitOn('frame-navigated');
            await page.click('a');
            await expect(navigate).resolves.toBeTruthy();
        });
        it('should await cross-process navigation when clicking anchor', async () => {
            server.setRoute('/empty.html', async (req, res) => {
                res.setHeader('Content-Type', 'text/html');
                res.end(`<link rel='stylesheet' href='./one-style.css'>`);
            });
            await (0, _pageTestUtils_1.setContent)(page, `<a href="${server.crossProcessBaseUrl}/empty.html">empty.html</a>`);
            const navigate = page.mainFrame.waitOn('frame-navigated');
            await page.click('a');
            await expect(navigate).resolves.toBeTruthy();
        });
        it('should await form-get on click', async () => {
            server.setRoute('/empty.html?foo=bar', async (req, res) => {
                res.setHeader('Content-Type', 'text/html');
                res.end(`<link rel='stylesheet' href='./one-style.css'>`);
            });
            await (0, _pageTestUtils_1.setContent)(page, `
  <form action="${server.emptyPage}" method="get">
    <input name="foo" value="bar">
    <input type="submit" value="Submit">
  </form>`);
            const navigate = page.mainFrame.waitOn('frame-navigated');
            await page.click('input[type=submit]');
            await expect(navigate).resolves.toBeTruthy();
        });
        it('should await form-post on click', async () => {
            server.setRoute('/empty.html', async (req, res) => {
                res.setHeader('Content-Type', 'text/html');
                res.end(`<link rel='stylesheet' href='./one-style.css'>`);
            });
            await (0, _pageTestUtils_1.setContent)(page, `
  <form action="${server.emptyPage}" method="post">
    <input name="foo" value="bar">
    <input type="submit" value="Submit">
  </form>`);
            const navigate = page.mainFrame.waitOn('frame-navigated');
            await page.click('input[type=submit]');
            await expect(navigate).resolves.toBeTruthy();
        });
        it('should await navigation when assigning location', async () => {
            server.setRoute('/empty.html', async (req, res) => {
                res.setHeader('Content-Type', 'text/html');
                res.end(`<link rel='stylesheet' href='./one-style.css'>`);
            });
            const navigate = page.mainFrame.waitOn('frame-navigated');
            await page.evaluate(`window.location.href = "${server.emptyPage}"`);
            await expect(navigate).resolves.toBeTruthy();
        });
        it('should await navigation when assigning location twice', async () => {
            const messages = [];
            server.setRoute('/empty.html?cancel', async (req, res) => {
                res.end('done');
            });
            server.setRoute('/empty.html?override', async (req, res) => {
                messages.push('routeoverride');
                res.end('done');
            });
            const navigatedEvent = page.mainFrame.waitOn('frame-navigated');
            await page.evaluate(`
    window.location.href = "${server.emptyPage}?cancel";
    window.location.href = "${server.emptyPage}?override";
  `);
            expect((await navigatedEvent).frame.url).toBe(`${server.emptyPage}?override`);
        });
        it('should await navigation when evaluating reload', async () => {
            await page.goto(server.emptyPage);
            server.setRoute('/empty.html', async (req, res) => {
                res.setHeader('Content-Type', 'text/html');
                res.end(`<link rel='stylesheet' href='./one-style.css'>`);
            });
            const navigate = page.mainFrame.waitOn('frame-navigated');
            await page.evaluate(`window.location.reload()`);
            await expect(navigate).resolves.toBeTruthy();
        });
        it('should await navigating specified target', async () => {
            server.setRoute('/empty.html', async (req, res) => {
                res.setHeader('Content-Type', 'text/html');
                res.end(`<link rel='stylesheet' href='./one-style.css'>`);
            });
            await (0, _pageTestUtils_1.setContent)(page, `
  <a href="${server.emptyPage}" target=target>empty.html</a>
  <iframe name=target></iframe>
`);
            const frame = page.frames.find(x => x.name === 'target');
            const nav = frame.waitOn('frame-navigated');
            await page.click('a');
            await nav;
            expect(frame.url).toBe(server.emptyPage);
        });
        it('should be able to navigate directly following click', async () => {
            server.setRoute('/login.html', async (req, res) => {
                res.setHeader('Content-Type', 'text/html');
                res.end(`You are logged in`);
            });
            await (0, _pageTestUtils_1.setContent)(page, `
  <form action="${server.baseUrl}/login.html" method="get">
    <input type="text">
    <input type="submit" value="Submit">
  </form>`);
            await page.click('input[type=text]');
            await page.type('admin');
            await page.click('input[type=submit]');
            // when the process gets busy, it will schedule the empty page navigation but then get interrupted by the click
            // ... ideally we could force it to always overlap, but in interim, just check for either condition
            try {
                const result = await page.navigate(server.emptyPage);
                expect(result.loaderId).toBeTruthy();
            }
            catch (error) {
                expect(String(error)).toMatch(/net::ERR_ABORTED/);
            }
        });
    });
    describe('access', () => {
        test('should allow query selectors in cross-domain frames', async () => {
            const koaServer = await index_1.Helpers.runKoaServer(false);
            const agent = new Agent_1.default({
                browserEngine: browser.engine,
                logger: index_1.TestLogger.forTest(module),
            });
            agent.hook({
                onNewBrowser(b) {
                    b.engine.launchArguments.push('--site-per-process', '--host-rules=MAP * 127.0.0.1');
                },
            });
            index_1.Helpers.needsClosing.push(agent);
            await agent.open();
            koaServer.get('/iframePage', ctx => {
                ctx.body = `
        <body>
        <h1>Iframe Page</h1>
<iframe src="http://framesy.org/page"></iframe>
        </body>
      `;
            });
            agent.mitmRequestSession.interceptorHandlers.push({
                urls: ['http://framesy.org/page'],
                handlerFn(url, type, request, response) {
                    response.end(`<html lang="en"><body>
<h1>Framesy Page</h1>
<div>This is content inside the frame</div>
</body></html>`);
                    return true;
                },
            });
            // eslint-disable-next-line @typescript-eslint/no-shadow
            const page = await agent.newPage();
            await page.goto(`${koaServer.baseUrl}/iframePage`);
            await page.waitForLoad('DomContentLoaded');
            const outerH1 = await page.mainFrame.jsPath.exec([
                'window',
                'document',
                ['querySelector', 'h1'],
                'textContent',
            ]);
            expect(outerH1.value).toBe('Iframe Page');
            // should not allow cross-domain access
            await expect(page.mainFrame.jsPath.exec([
                'window',
                'document',
                ['querySelector', 'iframe'],
                'contentDocument',
                ['querySelector', 'h1'],
                'textContent',
            ])).rejects.toThrow();
            await Promise.all(page.frames.map(x => x.waitForLoad({ loadStatus: 'DomContentLoaded' })));
            const innerFrame = page.frames.find(x => x.url === 'http://framesy.org/page');
            const innerH1 = await innerFrame.jsPath.exec([
                'window',
                'document',
                ['querySelector', 'h1'],
                'textContent',
            ]);
            expect(innerH1.value).toBe('Framesy Page');
            await agent.close();
        });
    });
});
//# sourceMappingURL=Frames.test.js.map