"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("@ulixee/unblocked-agent-testing/index");
const Pool_1 = require("@ulixee/unblocked-agent/lib/Pool");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const index_2 = require("../index");
const BrowserData_1 = require("../lib/BrowserData");
const logger = index_1.TestLogger.forTest(module);
const tlsSpy = jest.spyOn(index_2.default.prototype, 'onTlsConfiguration');
let koaServer;
let pool;
beforeEach(index_1.Helpers.beforeEach);
beforeAll(async () => {
    pool = new Pool_1.default({ plugins: [index_2.default] });
    await pool.start();
    index_1.Helpers.onClose(() => pool.close(), true);
    koaServer = await index_1.Helpers.runKoaServer();
});
afterAll(index_1.Helpers.afterAll);
afterEach(index_1.Helpers.afterEach);
describe('emulator', () => {
    it('should set for all pages', async () => {
        let firstUserAgentOption;
        let firstBrowserEngine;
        {
            const agent = pool.createAgent({
                customEmulatorConfig: { userAgentSelector: '~ mac = 14' },
                logger,
            });
            index_1.Helpers.needsClosing.push(agent);
            const page = await agent.newPage();
            await page.goto(koaServer.baseUrl);
            index_1.Helpers.needsClosing.push(page);
            // confirm plugins are called
            expect(tlsSpy).toHaveBeenCalledTimes(1);
            const userAgentOption = agent.emulationProfile.userAgentOption;
            firstUserAgentOption = userAgentOption;
            firstBrowserEngine = agent.emulationProfile.browserEngine;
            expect(await page.evaluate(`navigator.userAgent`)).toBe(userAgentOption.string);
            expect(await page.evaluate(`navigator.platform`)).toBe(agent.emulationProfile.windowNavigatorPlatform);
            expect(await page.evaluate(`navigator.languages`)).toStrictEqual(['en-US', 'en']);
            expect(await page.evaluate('screen.height')).toBe(agent.emulationProfile.viewport?.screenHeight);
            await agent.close();
        }
        {
            const agent = pool.createAgent({
                userAgentOption: {
                    ...firstUserAgentOption,
                    string: 'foobar',
                },
                windowNavigatorPlatform: 'Windows',
                browserEngine: firstBrowserEngine,
                logger,
                options: {
                    locale: 'de',
                    viewport: {
                        screenHeight: 901,
                        screenWidth: 1024,
                        positionY: 1,
                        positionX: 0,
                        height: 900,
                        width: 1024,
                    },
                },
            });
            index_1.Helpers.needsClosing.push(agent);
            const page = await agent.newPage();
            index_1.Helpers.needsClosing.push(page);
            const headersPromise = new Resolvable_1.default();
            koaServer.get('/emulator-test', ctx => {
                headersPromise.resolve(ctx.req.headers);
                ctx.body = '<html><h1>test</h1></html>';
            });
            await page.goto(`${koaServer.baseUrl}/emulator-test`);
            const headers = await headersPromise;
            expect(headers['user-agent']).toBe('foobar');
            expect(await page.evaluate(`navigator.userAgent`)).toBe('foobar');
            expect(await page.evaluate(`navigator.platform`)).toBe('Windows');
            expect(await page.evaluate(`navigator.languages`)).toStrictEqual(['de']);
            expect(await page.evaluate('screen.height')).toBe(901);
            await agent.close();
        }
    }, 20e3);
    it('should work for subframes', async () => {
        let firstUserAgentOption;
        let firstBrowserEngine;
        {
            const agent = pool.createAgent({
                logger,
            });
            index_1.Helpers.needsClosing.push(agent);
            const page = await agent.newPage();
            index_1.Helpers.needsClosing.push(page);
            firstUserAgentOption = agent.emulationProfile.userAgentOption;
            firstBrowserEngine = agent.emulationProfile.browserEngine;
            expect(await page.evaluate(`navigator.userAgent`)).toContain(agent.emulationProfile.userAgentOption.string);
            await agent.close();
        }
        {
            const agent = pool.createAgent({
                userAgentOption: {
                    ...firstUserAgentOption,
                    string: 'foobar',
                },
                browserEngine: firstBrowserEngine,
                logger,
            });
            index_1.Helpers.needsClosing.push(agent);
            const page = await agent.newPage();
            index_1.Helpers.needsClosing.push(page);
            const didRequest = new Resolvable_1.default();
            koaServer.get('/iframe', ctx => {
                didRequest.resolve(ctx.req);
                ctx.body = '';
            });
            const [request] = await Promise.all([
                didRequest.promise,
                page.evaluate(`(async () => {
        const frame = document.createElement('iframe');
        frame.src = '${koaServer.baseUrl}/iframe';
        frame.id = 'frame1';
        document.body.appendChild(frame);
        await new Promise(x => frame.onload = x);
      })()`),
            ]);
            expect(request.headers['user-agent']).toBe('foobar');
            await agent.close();
        }
    });
    it('should be able to add windows variables', async () => {
        BrowserData_1.default.localOsMeta = { name: 'linux', version: '' };
        const agent = pool.createAgent({
            customEmulatorConfig: { userAgentSelector: '~ windows = 10' },
            logger,
        });
        index_1.Helpers.needsClosing.push(agent);
        const page = await agent.newPage();
        await page.goto(koaServer.baseUrl);
        await page.waitForLoad('DomContentLoaded');
        const descriptorsJson = await page.evaluate('JSON.stringify(Object.getOwnPropertyDescriptors(Navigator.prototype))');
        const descriptors = JSON.parse(descriptorsJson);
        expect(descriptors.canShare).toBeTruthy();
    });
});
//# sourceMappingURL=basic.test.js.map