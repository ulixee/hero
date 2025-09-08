"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hero_testing_1 = require("@ulixee/hero-testing");
const Location_1 = require("@ulixee/unblocked-specification/agent/browser/Location");
const EmittingTransportToClient_1 = require("@ulixee/net/lib/EmittingTransportToClient");
const index_1 = require("../index");
let koaServer;
let connection;
let core;
const onEventFn = jest.fn();
beforeAll(async () => {
    koaServer = await hero_testing_1.Helpers.runKoaServer();
    const transport = new EmittingTransportToClient_1.default();
    core = await index_1.default.start();
    connection = core.addConnection(transport);
    hero_testing_1.Helpers.onClose(() => connection.disconnect(), true);
    transport.on('outbound', payload => {
        if (payload.listenerId) {
            onEventFn(payload);
        }
    });
});
afterAll(async () => {
    await hero_testing_1.Helpers.afterAll();
});
afterEach(hero_testing_1.Helpers.afterEach);
describe('Core events tests', () => {
    it('receives close event when closed', async () => {
        const meta = await connection.createSession();
        // @ts-ignore
        const events = connection.sessionIdToRemoteEvents
            .get(meta.sessionId)
            .getEventTarget({ sessionId: meta.sessionId });
        await events.addEventListener(null, 'close');
        await index_1.Session.get(meta.sessionId).close();
        expect(onEventFn.mock.calls).toHaveLength(1);
    });
    it('receives resource events', async () => {
        onEventFn.mockClear();
        const meta = await connection.createSession();
        // @ts-ignore
        const events = connection.sessionIdToRemoteEvents.get(meta.sessionId).getEventTarget({
            tabId: meta.tabId,
            sessionId: meta.sessionId,
        });
        await events.addEventListener(null, 'resource');
        koaServer.get('/page1', ctx => (ctx.body = '<body><img src="/resource.png"></body>'));
        koaServer.get('/page2', ctx => (ctx.body = '<body><img src="/resource.png"></body>'));
        const tab = index_1.Session.getTab(meta);
        hero_testing_1.Helpers.needsClosing.push(tab.session);
        await tab.goto(`${koaServer.baseUrl}/page1`);
        await tab.waitForLoad(Location_1.LocationStatus.PaintingStable);
        await tab.goto(`${koaServer.baseUrl}/page2`);
        await tab.waitForLoad(Location_1.LocationStatus.PaintingStable);
        // TODO: this should really be 2; it's emitting base document as an resource
        expect(onEventFn.mock.calls.map(x => x[0].data[0].url).filter(x => !x.includes('favicon.ico'))).toHaveLength(4);
    }, 10e3);
    it('removes event listeners', async () => {
        onEventFn.mockClear();
        const meta = await connection.createSession();
        // @ts-ignore
        const events = connection.sessionIdToRemoteEvents.get(meta.sessionId).getEventTarget({
            tabId: meta.tabId,
            sessionId: meta.sessionId,
        });
        const { listenerId } = await events.addEventListener(null, 'resource');
        koaServer.get('/page1', ctx => (ctx.body = '<body><img src="/resource.png"></body>'));
        koaServer.get('/page2', ctx => (ctx.body = '<body><img src="/resource.png"></body>'));
        const tab = index_1.Session.getTab(meta);
        hero_testing_1.Helpers.needsClosing.push(tab.session);
        await tab.goto(`${koaServer.baseUrl}/page1`);
        await tab.waitForLoad(Location_1.LocationStatus.AllContentLoaded);
        await events.removeEventListener(listenerId);
        await tab.goto(`${koaServer.baseUrl}/page2`);
        await tab.waitForLoad(Location_1.LocationStatus.PaintingStable);
        // TODO: this should really be 1; it's emitting base document as an resource
        expect(onEventFn.mock.calls).toHaveLength(2);
    }, 10e3);
});
//# sourceMappingURL=events.test.js.map