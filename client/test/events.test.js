"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Resource_1 = require("../lib/Resource");
const index_1 = require("../index");
const _MockConnectionToCore_1 = require("./_MockConnectionToCore");
const sessionMeta = {
    tabId: 1,
    sessionId: 'session-id',
};
let testConnection;
beforeEach(() => {
    testConnection = new _MockConnectionToCore_1.default(message => {
        const { command, messageId } = message;
        if (command === 'Core.createSession') {
            return { data: sessionMeta, responseId: messageId };
        }
        if (command === 'Events.addEventListener') {
            return {
                data: { listenerId: 'listener-id' },
                responseId: messageId,
            };
        }
        return { data: {}, responseId: messageId };
    });
});
function fakeEvent(eventType, listenerId, ...data) {
    testConnection.fakeEvent({
        meta: sessionMeta,
        eventType,
        listenerId,
        data,
    });
}
describe('events', () => {
    it('receives close event', async () => {
        const hero = new index_1.default({ connectionToCore: testConnection });
        let isClosed = false;
        await hero.on('close', () => {
            isClosed = true;
        });
        testConnection.fakeEvent({
            meta: { sessionId: sessionMeta.sessionId },
            eventType: 'close',
            listenerId: 'listener-id',
            data: [],
        });
        await hero.close();
        const outgoingCommands = testConnection.outgoingSpy.mock.calls;
        expect(outgoingCommands.map(c => c[0].command)).toMatchObject([
            'Core.connect',
            'Core.createSession',
            'Events.addEventListener', // user added close listener
            'Session.close',
        ]);
        expect(isClosed).toBe(true);
    });
    it('adds and removes event listeners', async () => {
        let eventCount = 0;
        const hero = new index_1.default({ connectionToCore: testConnection });
        const onResourceFn = (resource) => {
            expect(resource).toBeInstanceOf(Resource_1.default);
            eventCount += 1;
        };
        await hero.activeTab.on('resource', onResourceFn);
        fakeEvent('resource', 'listener-id', {
            id: 1,
        });
        fakeEvent('resource', 'listener-id', {
            id: 2,
        });
        // need to wait since events are handled on a promise resolution
        await new Promise(setImmediate);
        expect(eventCount).toBe(2);
        await hero.activeTab.off('resource', onResourceFn);
        fakeEvent('resource', 'listener-id', {
            id: 3,
        });
        expect(eventCount).toBe(2);
    });
});
//# sourceMappingURL=events.test.js.map