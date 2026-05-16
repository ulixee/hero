"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("@ulixee/hero-testing/index");
const Fs = require("fs");
const index_2 = require("../index");
afterEach(index_1.Helpers.afterEach);
afterAll(index_1.Helpers.afterAll);
describe('basic Core tests', () => {
    it('starts, configures, and shuts down', async () => {
        const core = new index_2.default();
        index_1.Helpers.onClose(core.close);
        const connection = core.addConnection();
        index_1.Helpers.onClose(() => connection.disconnect());
        await connection.connect({ maxConcurrentClientCount: 5 });
        expect(core.pool.maxConcurrentAgents).toBe(5);
        expect(core.pool.activeAgentsCount).toBe(0);
        await index_2.default.shutdown();
    });
    it('runs createTab', async () => {
        const core = new index_2.default();
        index_1.Helpers.onClose(core.close);
        const connection = core.addConnection();
        index_1.Helpers.onClose(() => connection.disconnect());
        await connection.connect({ maxConcurrentClientCount: 2 });
        await connection.createSession();
        expect(core.pool.maxConcurrentAgents).toBe(2);
        expect(core.pool.activeAgentsCount).toBe(1);
        const didClose = new Promise(resolve => index_2.Session.events.on('closed', resolve));
        await core.close();
        expect(core.pool.activeAgentsCount).toBe(0);
        await expect(didClose).resolves.toBeTruthy();
    });
    it('can delete session databases', async () => {
        const core = new index_2.default();
        index_1.Helpers.onClose(core.close);
        const connection = core.addConnection();
        index_1.Helpers.onClose(() => connection.disconnect());
        await connection.connect({ maxConcurrentClientCount: 2 });
        const { session } = await index_2.Session.create({ sessionPersistence: false }, core);
        expect(Fs.existsSync(session.db.path)).toBe(true);
        await session.close();
        expect(Fs.existsSync(session.db.path)).toBe(false);
    });
    it('can subscribe to Sessions created and closed', async () => {
        const core = new index_2.default();
        index_1.Helpers.onClose(core.close);
        const newSession = jest.fn();
        const closedSession = jest.fn();
        index_2.Session.events.on('new', newSession);
        index_2.Session.events.on('closed', closedSession);
        const { session } = await index_2.Session.create({}, core);
        index_1.Helpers.needsClosing.push(session);
        expect(newSession).toHaveBeenCalledTimes(1);
        expect(newSession.mock.calls[0]).toBeTruthy();
        await session.close();
        await new Promise(setImmediate);
        expect(closedSession).toHaveBeenCalledTimes(1);
        expect(closedSession.mock.calls[0][0].id).toBe(session.id);
        expect(closedSession.mock.calls[0][0].databasePath).toBeTruthy();
    });
});
//# sourceMappingURL=basic.test.js.map