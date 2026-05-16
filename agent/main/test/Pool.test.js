"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const unblocked_agent_testing_1 = require("@ulixee/unblocked-agent-testing");
const IUnblockedPlugin_1 = require("@ulixee/unblocked-specification/plugin/IUnblockedPlugin");
const index_1 = require("../index");
let httpServer;
beforeAll(async () => {
    httpServer = await unblocked_agent_testing_1.Helpers.runHttpServer({ onlyCloseOnFinal: true });
});
afterEach(unblocked_agent_testing_1.Helpers.afterEach);
afterAll(unblocked_agent_testing_1.Helpers.afterAll);
beforeEach(() => {
    unblocked_agent_testing_1.TestLogger.testNumber += 1;
});
describe('Pool tests', () => {
    it('should be able to get multiple entries out of the pool', async () => {
        const pool = new index_1.Pool({ maxConcurrentAgents: 3, ...unblocked_agent_testing_1.BrowserUtils.newPoolOptions });
        unblocked_agent_testing_1.Helpers.needsClosing.push(pool);
        expect(pool.activeAgentsCount).toBe(0);
        const agent1 = pool.createAgent({ logger: unblocked_agent_testing_1.TestLogger.forTest(module) });
        unblocked_agent_testing_1.Helpers.needsClosing.push(agent1);
        const page1 = await agent1.newPage();
        // #1
        await page1.goto(`${httpServer.baseUrl}/pool1`);
        expect(pool.activeAgentsCount).toBe(1);
        const agent2 = pool.createAgent({ logger: unblocked_agent_testing_1.TestLogger.forTest(module) });
        unblocked_agent_testing_1.Helpers.needsClosing.push(agent2);
        const page2 = await agent2.newPage();
        // #2
        await page2.goto(`${httpServer.baseUrl}/pool2`);
        expect(pool.activeAgentsCount).toBe(2);
        const agent3 = pool.createAgent({ logger: unblocked_agent_testing_1.TestLogger.forTest(module) });
        const page3 = await agent3.newPage();
        unblocked_agent_testing_1.Helpers.needsClosing.push(agent3);
        // #3
        await page3.goto(`${httpServer.baseUrl}/pool3`);
        expect(pool.activeAgentsCount).toBe(3);
        // #4
        const agent4Promise = pool.createAgent({ logger: unblocked_agent_testing_1.TestLogger.forTest(module) });
        expect(pool.activeAgentsCount).toBe(3);
        await agent1.close();
        const agent4 = await agent4Promise;
        unblocked_agent_testing_1.Helpers.needsClosing.push(agent4);
        const page4 = await agent4.newPage();
        // should give straight to this waiting promise
        expect(pool.activeAgentsCount).toBe(3);
        await page4.goto(`${httpServer.baseUrl}/pool4`);
        await agent4.close();
        expect(pool.activeAgentsCount).toBe(2);
        await Promise.all([agent1.close(), agent2.close(), agent3.close()]);
        expect(pool.activeAgentsCount).toBe(0);
        await pool.close();
    }, 15e3);
    it('should be able to maximize sessions per browser', async () => {
        const pool = new index_1.Pool({
            maxConcurrentAgents: 4,
            maxConcurrentAgentsPerBrowser: 2,
            ...unblocked_agent_testing_1.BrowserUtils.newPoolOptions,
        });
        unblocked_agent_testing_1.Helpers.needsClosing.push(pool);
        expect(pool.activeAgentsCount).toBe(0);
        const agents = [];
        for (let i = 0; i < 4; i += 1) {
            const agent = pool.createAgent({ logger: unblocked_agent_testing_1.TestLogger.forTest(module) });
            unblocked_agent_testing_1.Helpers.needsClosing.push(agent);
            const page = await agent.newPage();
            await page.goto(`${httpServer.baseUrl}/pool${i + 1}`);
            agents.push(agent);
        }
        expect(pool.activeAgentsCount).toBe(4);
        expect(pool.browsersById.size).toBe(2);
        // @ts-expect-error
        const agentsByBrowserId = pool.agentsByBrowserId;
        // @ts-expect-error
        const browserIdByAgentId = pool.browserIdByAgentId;
        expect(Object.keys(browserIdByAgentId).length).toBe(4);
        expect(Object.keys(agentsByBrowserId).length).toBe(2);
        [...pool.browsersById.values()].forEach(x => expect(x.browserContextsById.size).toBe(2));
        const nextAgent = pool.createAgent({ logger: unblocked_agent_testing_1.TestLogger.forTest(module) });
        expect(pool.activeAgentsCount).toBe(4);
        const toClose = agents.shift();
        const closeBrowserId = toClose.browserContext.browserId;
        await toClose.close();
        expect(pool.activeAgentsCount).toBe(3);
        expect(Object.keys(browserIdByAgentId).length).toBe(3);
        expect(Object.keys(agentsByBrowserId).length).toBe(2);
        expect(agentsByBrowserId[closeBrowserId]).toBe(1);
        unblocked_agent_testing_1.Helpers.needsClosing.push(nextAgent);
        agents.push(nextAgent);
        await nextAgent.newPage();
        expect(pool.activeAgentsCount).toBe(4);
        expect(Object.keys(agentsByBrowserId).length).toBe(2);
        expect(agentsByBrowserId[closeBrowserId]).toBe(2);
        expect(pool.browsersById.size).toBe(2);
        await Promise.all(agents.map(x => x.close()));
    }, 15e3);
    it('reuses the same browser', async () => {
        const pool = new index_1.Pool({
            maxConcurrentAgents: 1,
            maxConcurrentAgentsPerBrowser: 1,
        });
        unblocked_agent_testing_1.Helpers.needsClosing.push(pool);
        for (let i = 0; i < 5; i += 1) {
            const agent = pool.createAgent({
                logger: unblocked_agent_testing_1.TestLogger.forTest(module),
            });
            unblocked_agent_testing_1.Helpers.needsClosing.push(agent);
            const page = await agent.newPage();
            await page.goto(`${httpServer.baseUrl}/pool${i + 1}`);
            await expect(page.execJsPath(['document', 'title'])).resolves.toBeTruthy();
            await agent.close();
            expect(pool.activeAgentsCount).toBe(0);
            expect(pool.browsersById.size).toBe(1);
        }
    });
    it('should emit events when all pages are closed', async () => {
        const pool = new index_1.Pool(unblocked_agent_testing_1.BrowserUtils.newPoolOptions);
        unblocked_agent_testing_1.Helpers.needsClosing.push(pool);
        const agent = pool.createAgent({ logger: unblocked_agent_testing_1.TestLogger.forTest(module) });
        unblocked_agent_testing_1.Helpers.needsClosing.push(agent);
        const page = await agent.newPage();
        await page.goto(`${httpServer.baseUrl}/context-events`);
        const allPagesClosed = jest.fn();
        page.browserContext.on('all-pages-closed', allPagesClosed);
        await page.close();
        expect(allPagesClosed).toHaveBeenCalledTimes(1);
        await pool.close();
    });
    it('should emit an event when a browser has no open windows', async () => {
        const pool = new index_1.Pool(unblocked_agent_testing_1.BrowserUtils.newPoolOptions);
        unblocked_agent_testing_1.Helpers.needsClosing.push(pool);
        const agent1 = pool.createAgent({ logger: unblocked_agent_testing_1.TestLogger.forTest(module) });
        unblocked_agent_testing_1.Helpers.needsClosing.push(agent1);
        const page = await agent1.newPage();
        await page.goto(`${httpServer.baseUrl}/no-windows`);
        const agent2 = pool.createAgent({ logger: unblocked_agent_testing_1.TestLogger.forTest(module) });
        unblocked_agent_testing_1.Helpers.needsClosing.push(agent2);
        const page2 = await agent2.newPage();
        await page2.goto(`${httpServer.baseUrl}/no-windows2`);
        const browserWindowsClosed = jest.fn();
        const didCallPromise = new Resolvable_1.default();
        pool.on('browser-has-no-open-windows', () => {
            browserWindowsClosed();
            didCallPromise.resolve();
        });
        await page.close();
        expect(browserWindowsClosed).toHaveBeenCalledTimes(0);
        await page2.close();
        await didCallPromise.promise;
        expect(browserWindowsClosed).toHaveBeenCalledTimes(1);
        await pool.close();
    });
    it('should emit all browsers closed event', async () => {
        const pool = new index_1.Pool(unblocked_agent_testing_1.BrowserUtils.newPoolOptions);
        unblocked_agent_testing_1.Helpers.needsClosing.push(pool);
        const agent = pool.createAgent({ logger: unblocked_agent_testing_1.TestLogger.forTest(module) });
        unblocked_agent_testing_1.Helpers.needsClosing.push(agent);
        const page = await agent.newPage();
        const allBrowsersTriggered = new Resolvable_1.default();
        const allBrowsersClosedEvent = jest.fn();
        pool.on('all-browsers-closed', () => {
            allBrowsersTriggered.resolve();
            allBrowsersClosedEvent();
        });
        const browsers = pool.browsersById;
        expect(browsers.size).toBe(1);
        const browser1 = [...browsers.values()][0];
        expect(allBrowsersClosedEvent).toHaveBeenCalledTimes(0);
        // TODO we fixed this in test here, should browser.ts always assign new dataDir. Seems this
        // behaviour is good so we can always pass it, but then you have to know what you are doing.
        const browserEngine = {
            ...browser1.engine,
            userDataDir: undefined,
            launchArguments: [
                ...browser1.engine.launchArguments.filter(arg => !arg.includes('--user-data-dir=')),
                'test2',
            ],
        };
        const browser2 = await pool.getBrowser(browserEngine, '2', {});
        expect(browsers.size).toBe(2);
        expect(allBrowsersClosedEvent).toHaveBeenCalledTimes(0);
        await page.close();
        await browser1.close();
        expect(allBrowsersClosedEvent).toHaveBeenCalledTimes(0);
        await browser2.close();
        await allBrowsersTriggered.promise;
        expect(allBrowsersClosedEvent).toHaveBeenCalledTimes(1);
        await pool.close();
    });
    test('should be able to use an upstream proxy with mitm disabled', async () => {
        const proxyServer = await unblocked_agent_testing_1.Helpers.runHttpServer();
        const httpsServer = await unblocked_agent_testing_1.Helpers.runHttpsServer((req, res) => res.end('good'));
        const upstreamProxyUrl = proxyServer.url.replace(/\/$/, '');
        let upstreamProxyConnected = false;
        proxyServer.on('connect', (req, socket) => {
            upstreamProxyConnected = true;
            socket.end();
        });
        const pool = new index_1.Pool(unblocked_agent_testing_1.BrowserUtils.newPoolOptions);
        unblocked_agent_testing_1.Helpers.needsClosing.push(pool);
        await pool.start();
        let TestPlugin = class TestPlugin {
            static shouldActivate(profile) {
                profile.upstreamProxyUrl = upstreamProxyUrl;
                profile.options.disableMitm = true;
                return true;
            }
        };
        TestPlugin.id = 'TestPlugin';
        TestPlugin = __decorate([
            IUnblockedPlugin_1.UnblockedPluginClassDecorator
        ], TestPlugin);
        const agent = pool.createAgent({ logger: unblocked_agent_testing_1.TestLogger.forTest(module), plugins: [TestPlugin] });
        unblocked_agent_testing_1.Helpers.needsClosing.push(agent);
        expect(agent.plugins.profile.options.disableMitm).toBe(true);
        const page = await agent.newPage();
        expect(agent.browserContext.proxy.address).toBe(proxyServer.baseUrl);
        await page.goto(httpsServer.baseUrl).catch(console.error);
        expect(upstreamProxyConnected).toBe(true);
    });
});
//# sourceMappingURL=Pool.test.js.map