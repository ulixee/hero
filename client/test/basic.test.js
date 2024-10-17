"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hero_testing_1 = require("@ulixee/hero-testing");
const hosts_1 = require("@ulixee/commons/config/hosts");
const VersionUtils = require("@ulixee/commons/lib/VersionUtils");
const Callsite_1 = require("@ulixee/commons/lib/Callsite");
const index_1 = require("../index");
const ConnectionFactory_1 = require("../connections/ConnectionFactory");
const _MockConnectionToCore_1 = require("./_MockConnectionToCore");
const CallsiteLocator_1 = require("../lib/CallsiteLocator");
const pkg = require('../package.json');
afterAll(hero_testing_1.Helpers.afterAll);
afterEach(hero_testing_1.Helpers.afterEach);
const defaultMockedPayload = payload => {
    if (payload.command === 'Core.createSession') {
        return {
            responseId: payload.messageId,
            data: { tabId: 'tab-id', sessionId: 'session-id' },
        };
    }
    return {
        responseId: payload.messageId,
        data: {},
    };
};
describe('basic Hero tests', () => {
    it('creates and closes a hero', async () => {
        const connectionToCore = new _MockConnectionToCore_1.default(defaultMockedPayload);
        const hero = new index_1.default({ connectionToCore });
        await hero.connect();
        await hero.close();
        const outgoingCommands = connectionToCore.outgoingSpy.mock.calls;
        expect(outgoingCommands.map(c => c[0].command)).toMatchObject([
            'Core.connect',
            'Core.createSession',
            'Session.close',
        ]);
    });
    it('emits commandId events', async () => {
        const connectionToCore = new _MockConnectionToCore_1.default(defaultMockedPayload);
        const hero = new index_1.default({ connectionToCore });
        await hero.connect();
        const events = [];
        void hero.on('command', (command, commandId, args) => {
            events.push({ command, commandId, args });
        });
        await hero.close();
        const outgoingCommands = connectionToCore.outgoingSpy.mock.calls;
        expect(outgoingCommands.map(c => c[0].command)).toMatchObject([
            'Core.connect',
            'Core.createSession',
            'Session.close',
        ]);
        expect(events).toMatchObject([
            {
                command: 'Session.close',
                commandId: 1,
                args: [false],
            },
        ]);
    });
    it('includes callsites for commands', async () => {
        const connectionToCore = new _MockConnectionToCore_1.default(defaultMockedPayload);
        const hero = new index_1.default({ connectionToCore });
        await hero.connect();
        await hero.close();
        const outgoingCommands = connectionToCore.outgoingSpy.mock.calls;
        // Core.connect doesn't run over a command queue, so never gets callsites
        expect(outgoingCommands.filter(c => c[0].callsite)).toHaveLength(2);
    });
});
describe('Connection tests', () => {
    jest.spyOn(hosts_1.default.global, 'save').mockImplementation(() => null);
    hosts_1.default.global.setVersionHost('1', 'localhost:8080');
    it('connects to a started Cloud if the version is compatible', async () => {
        const version = pkg.version;
        const next = VersionUtils.nextVersion(version);
        await hosts_1.default.global.setVersionHost(next, 'localhost:8081');
        const connectionToCore = ConnectionFactory_1.default.createConnection({});
        expect(connectionToCore.transport.host).toContain('ws://localhost:8081');
    });
    it('should inform a user if a Cloud needs to be started', async () => {
        const version = pkg.version;
        const next = VersionUtils.nextVersion(version);
        await hosts_1.default.global.setVersionHost(next, null);
        ConnectionFactory_1.default.hasLocalCloudPackage = true;
        expect(() => ConnectionFactory_1.default.createConnection({})).toThrow('Ulixee Cloud is not started');
    });
    it('should inform a user if a Cloud needs to be installed', async () => {
        const version = pkg.version;
        const next = VersionUtils.nextVersion(version);
        await hosts_1.default.global.setVersionHost(next, null);
        ConnectionFactory_1.default.hasLocalCloudPackage = false;
        expect(() => ConnectionFactory_1.default.createConnection({})).toThrow('compatible Hero Core was not found');
    });
});
describe('CallsiteLocator tests', () => {
    it('should be able to properly get a script location', () => {
        const scriptInstance = new CallsiteLocator_1.default(Callsite_1.default.getEntrypoint());
        expect(scriptInstance.getCurrent()).toHaveLength(1);
        (function testNested() {
            expect(scriptInstance.getCurrent()).toHaveLength(2);
        })();
    });
});
//# sourceMappingURL=basic.test.js.map