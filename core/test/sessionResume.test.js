"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hero_testing_1 = require("@ulixee/hero-testing");
const Interactor_1 = require("@ulixee/unblocked-agent/lib/Interactor");
const default_browser_emulator_1 = require("@ulixee/default-browser-emulator");
const index_1 = require("../index");
const Session_1 = require("../lib/Session");
const playInteractionSpy = jest.spyOn(Interactor_1.default.prototype, 'play');
let koaServer;
let connectionToClient;
beforeAll(async () => {
    // remove the human emulator
    index_1.default.defaultUnblockedPlugins = [default_browser_emulator_1.default];
    const core = await index_1.default.start();
    connectionToClient = core.addConnection();
    await connectionToClient.connect();
    hero_testing_1.Helpers.onClose(() => connectionToClient.disconnect(), true);
    koaServer = await hero_testing_1.Helpers.runKoaServer();
});
afterAll(hero_testing_1.Helpers.afterAll);
afterEach(hero_testing_1.Helpers.afterEach);
describe('miscellaneous', () => {
    test('can pause and resume sessions', async () => {
        playInteractionSpy.mockClear();
        koaServer.get('/sessionPause1', async (ctx) => {
            ctx.body = `<body><h1>Done</h1></body>`;
        });
        koaServer.get('/sessionPause2', async (ctx) => {
            ctx.body = `<body><h1>Done</h1></body>`;
        });
        const { session, tab } = await createSession();
        await tab.goto(`${koaServer.baseUrl}/sessionPause1`);
        await session.pauseCommands();
        const pauseResponse = tab.goto(`${koaServer.baseUrl}/sessionPause2`);
        const response = await Promise.race([
            pauseResponse,
            new Promise(resolve => setTimeout(resolve, 500)),
        ]);
        expect(response).not.toBeTruthy();
        expect(tab.url).toBe(`${koaServer.baseUrl}/sessionPause1`);
        await session.resumeCommands();
        await expect(pauseResponse).resolves.toBeTruthy();
        expect(tab.url).toBe(`${koaServer.baseUrl}/sessionPause2`);
    });
});
describe('sessionResume tests when resume location is sessionStart', () => {
    test('should restart a session within a currently open browserContext', async () => {
        playInteractionSpy.mockClear();
        let counter = 1;
        koaServer.get('/sessionResumeSessionStart', ctx => {
            ctx.cookies.set(`Cookie${counter}`, 'This is a test', {
                httpOnly: true,
            });
            counter += 1;
            ctx.body = `<body><h1>title</h1></body>`;
        });
        let sessionId;
        let firstTabPageId;
        let profile;
        {
            const { session, tab } = await createSession({ sessionKeepAlive: true });
            sessionId = session.id;
            firstTabPageId = tab.page.id;
            simulateScriptSendingCommandMeta(session, 1);
            await tab.goto(`${koaServer.baseUrl}/sessionResumeSessionStart`);
            simulateScriptSendingCommandMeta(session, 2);
            await tab.interact([
                { command: 'move', mousePosition: ['document', ['querySelector', 'h1']] },
            ]);
            expect(playInteractionSpy).toHaveBeenCalledTimes(1);
            profile = await session.exportUserProfile();
        }
        {
            playInteractionSpy.mockClear();
            const { session, tab } = await createSession({
                sessionKeepAlive: true,
                resumeSessionId: sessionId,
                resumeSessionStartLocation: 'sessionStart',
            });
            expect(session.id).not.toBe(sessionId);
            expect(tab.page.id).not.toBe(firstTabPageId);
            simulateScriptSendingCommandMeta(session, 1);
            await tab.goto(`${koaServer.baseUrl}/sessionResumeSessionStart`);
            simulateScriptSendingCommandMeta(session, 2);
            await tab.interact([
                { command: 'move', mousePosition: ['document', ['querySelector', 'h1']] },
            ]);
            expect(playInteractionSpy).toHaveBeenCalledTimes(1);
            const newProfile = await session.exportUserProfile();
            expect(newProfile.userAgentString).toBe(profile.userAgentString);
            expect(newProfile.deviceProfile).toEqual(profile.deviceProfile);
            expect(newProfile.cookies).not.toEqual(profile.cookies);
            expect(newProfile.cookies.filter(x => x.name === 'Cookie1')).toHaveLength(0);
            expect(newProfile.cookies.filter(x => x.name === 'Cookie2')).toHaveLength(1);
        }
    });
    test('should restart a session with a closed session', async () => {
        playInteractionSpy.mockClear();
        let counter = 1;
        koaServer.get('/sessionResumeSessionStartClosed', ctx => {
            ctx.cookies.set(`Cookie${counter}`, 'This is a test', {
                httpOnly: true,
            });
            counter += 1;
            ctx.body = `<body><h1>title</h1></body>`;
        });
        let sessionId;
        let firstTabPageId;
        let profile;
        {
            const { session, tab } = await createSession({
                sessionKeepAlive: true,
                locale: 'de',
                userProfile: {
                    cookies: [
                        {
                            sameSite: 'None',
                            name: 'CookieRestore',
                            value: 'true',
                            domain: 'localhost',
                            path: '/',
                            expires: '-1',
                            httpOnly: true,
                            secure: false,
                        },
                    ],
                },
            });
            sessionId = session.id;
            firstTabPageId = tab.page.id;
            simulateScriptSendingCommandMeta(session, 1);
            await tab.goto(`${koaServer.baseUrl}/sessionResumeSessionStartClosed`);
            simulateScriptSendingCommandMeta(session, 2);
            await tab.interact([
                { command: 'move', mousePosition: ['document', ['querySelector', 'h1']] },
            ]);
            expect(playInteractionSpy).toHaveBeenCalledTimes(1);
            profile = await session.exportUserProfile();
            expect(profile.cookies).toHaveLength(2);
            await session.close(true);
        }
        {
            playInteractionSpy.mockClear();
            const { session, tab } = await createSession({
                sessionKeepAlive: true,
                resumeSessionId: sessionId,
                resumeSessionStartLocation: 'sessionStart',
            });
            // should be a new session this time
            expect(session.id).not.toBe(sessionId);
            expect(tab.page.id).not.toBe(firstTabPageId);
            simulateScriptSendingCommandMeta(session, 1);
            await tab.goto(`${koaServer.baseUrl}/sessionResumeSessionStartClosed`);
            simulateScriptSendingCommandMeta(session, 2);
            await tab.interact([
                { command: 'move', mousePosition: ['document', ['querySelector', 'h1']] },
            ]);
            expect(playInteractionSpy).toHaveBeenCalledTimes(1);
            expect(session.commands.history).toHaveLength(2);
            const meta = await session.getHeroMeta();
            expect(meta.locale).toBe('de');
            const newProfile = await session.exportUserProfile();
            expect(newProfile.userAgentString).toBe(profile.userAgentString);
            expect(newProfile.deviceProfile).toEqual(profile.deviceProfile);
            expect(newProfile.cookies).not.toEqual(profile.cookies);
            expect(newProfile.cookies.filter(x => x.name === 'Cookie1')).toHaveLength(0);
            expect(newProfile.cookies.filter(x => x.name === 'Cookie2')).toHaveLength(1);
            expect(newProfile.cookies.filter(x => x.name === 'CookieRestore')).toHaveLength(1);
        }
    });
    test('should throw an error if a session is not available to resume', async () => {
        await expect(createSession({
            sessionKeepAlive: true,
            resumeSessionId: 'notreal',
            resumeSessionStartLocation: 'sessionStart',
        })).rejects.toThrow();
    });
});
function simulateScriptSendingCommandMeta(session, id) {
    session.commands.presetMeta = {
        commandId: id,
        startTime: Date.now(),
        sendTime: Date.now(),
    };
}
async function createSession(options) {
    const meta = await connectionToClient.createSession(options);
    const tab = Session_1.default.getTab(meta);
    const session = tab.session;
    hero_testing_1.Helpers.onClose(() => session.close(true));
    return { session: tab.session, tab };
}
//# sourceMappingURL=sessionResume.test.js.map