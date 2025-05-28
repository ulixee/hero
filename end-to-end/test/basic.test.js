"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hero_1 = require("@ulixee/hero");
const hero_core_1 = require("@ulixee/hero-core");
const hero_testing_1 = require("@ulixee/hero-testing");
const TransportBridge_1 = require("@ulixee/net/lib/TransportBridge");
let koaServer;
let core;
beforeAll(async () => {
    core = new hero_core_1.default();
    hero_testing_1.Helpers.onClose(core.close, true);
    koaServer = await hero_testing_1.Helpers.runKoaServer();
});
afterAll(hero_testing_1.Helpers.afterAll);
afterEach(hero_testing_1.Helpers.afterEach);
describe('basic Full Client tests', () => {
    it('runs goto', async () => {
        const exampleUrl = `${koaServer.baseUrl}/`;
        const hero = new hero_testing_1.Hero();
        hero_testing_1.Helpers.needsClosing.push(hero);
        await hero.goto(exampleUrl);
        const url = await hero.document.location.host;
        expect(url).toBe(koaServer.baseHost);
    });
    it("doesn't automatically close an idle connection", async () => {
        const bridge = new TransportBridge_1.default();
        const connectionToCore = new hero_1.ConnectionToHeroCore(bridge.transportToCore);
        core.addConnection(bridge.transportToClient);
        hero_testing_1.Helpers.onClose(() => connectionToCore.disconnect());
        const disconnectSpy = jest.spyOn(connectionToCore, 'disconnect');
        const heros = [];
        for (let i = 0; i <= 3; i += 1) {
            const hero = new hero_1.default({ connectionToCore });
            heros.push(hero);
            hero_testing_1.Helpers.needsClosing.push(hero);
            await hero.goto(koaServer.baseUrl);
            await hero.waitForLoad('DomContentLoaded');
        }
        await Promise.all(heros.map(x => x.close()));
        await new Promise(resolve => setTimeout(resolve, 600));
        expect(disconnectSpy).toHaveBeenCalledTimes(0);
        const hero = new hero_1.default({ connectionToCore });
        heros.push(hero);
        hero_testing_1.Helpers.needsClosing.push(hero);
        await expect(hero.goto(koaServer.baseUrl)).resolves.toBeTruthy();
        await hero.waitForLoad('DomContentLoaded');
        await hero.close();
        expect(disconnectSpy).toHaveBeenCalledTimes(0);
    });
    it('can provide a sessionId', async () => {
        const hero = new hero_testing_1.Hero({ sessionId: 'session1' });
        hero_testing_1.Helpers.needsClosing.push(hero);
        expect(await hero.sessionId).toBe('session1');
    });
    it('should get unreachable proxy errors in the client', async () => {
        const hero = new hero_testing_1.Hero({
            upstreamProxyUrl: koaServer.baseUrl,
            upstreamProxyIpMask: {
                proxyIp: '127.0.0.1',
                publicIp: '127.0.0.1',
            },
        });
        hero_testing_1.Helpers.needsClosing.push(hero);
        await expect(hero.goto(`${koaServer.baseUrl}/`)).rejects.toThrow();
    });
    it('can access the location with no document loaded', async () => {
        const hero = new hero_testing_1.Hero();
        hero_testing_1.Helpers.needsClosing.push(hero);
        const url = await hero.document.location.host;
        expect(url).toBe('');
    });
    it('can get and set cookies', async () => {
        const hero = new hero_testing_1.Hero();
        hero_testing_1.Helpers.needsClosing.push(hero);
        koaServer.get('/cookies', ctx => {
            ctx.cookies.set('Cookie1', 'This is a test', {
                httpOnly: true,
            });
            ctx.body = '';
        });
        await hero.goto(`${koaServer.baseUrl}/cookies`);
        const cookieStorage = hero.activeTab.cookieStorage;
        {
            expect(await cookieStorage.length).toBe(1);
            const cookie = await cookieStorage.getItem('Cookie1');
            expect(cookie.expires).toBe(undefined);
            expect(cookie.httpOnly).toBe(true);
            // httponly not in doc
            const documentCookies = await hero.getJsValue('document.cookie');
            expect(documentCookies).toBe('');
        }
        {
            const expires = new Date();
            expires.setTime(Date.now() + 10e3);
            await cookieStorage.setItem('Cookie2', 'test2', { expires });
            expect(await cookieStorage.length).toBe(2);
            const cookie = await cookieStorage.getItem('Cookie2');
            expect(cookie.expires).toBe(expires.toISOString());
            expect(cookie.httpOnly).toBe(false);
            const documentCookies = await hero.getJsValue('document.cookie');
            expect(documentCookies).toBe('Cookie2=test2');
        }
        // test deleting
        {
            await cookieStorage.removeItem('Cookie2');
            expect(await cookieStorage.length).toBe(1);
            const documentCookies = await hero.getJsValue('document.cookie');
            expect(documentCookies).toBe('');
        }
        // test deleting a subdomain cookie
        await cookieStorage.removeItem('Cookie1');
        expect(await cookieStorage.length).toBe(0);
    });
    it('can get and set subdomain cookies', async () => {
        const hero = new hero_testing_1.Hero();
        hero_testing_1.Helpers.needsClosing.push(hero);
        const session = hero_core_1.Session.get(await hero.sessionId);
        session.agent.mitmRequestSession.interceptorHandlers.push({
            urls: ['https://ulixee.org'],
            handlerFn(url, type, request, response) {
                response.setHeader('Set-Cookie', [
                    'CookieMain=main; httpOnly',
                    'CookieSub=sub; domain=.ulixee.org',
                ]);
                response.end(`<html lang='en'>
<head><link rel="icon" href="data:,"></head>
<body>
<h1>Page Title</h1>
</body>
</html>`);
                return true;
            },
        });
        await hero.goto(`https://ulixee.org`);
        await hero.activeTab.waitForLoad('DomContentLoaded');
        const cookieStorage = hero.activeTab.cookieStorage;
        {
            expect(await cookieStorage.length).toBe(2);
            const cookie = await cookieStorage.getItem('CookieMain');
            expect(cookie.expires).toBe(undefined);
            expect(cookie.httpOnly).toBe(true);
            const cookieSub = await cookieStorage.getItem('CookieSub');
            expect(cookieSub.expires).toBe(undefined);
            expect(cookieSub.domain).toBe('.ulixee.org');
            // httponly not in doc
            const documentCookies = await hero.getJsValue('document.cookie');
            expect(documentCookies).toBe('CookieSub=sub');
        }
        // test deleting a subdomain cookie
        await cookieStorage.removeItem('CookieSub');
        expect(await cookieStorage.length).toBe(1);
        await cookieStorage.removeItem('CookieMain');
        expect(await cookieStorage.length).toBe(0);
    });
    it('should send a friendly message if trying to set cookies before a url is loaded', async () => {
        const hero = new hero_testing_1.Hero();
        hero_testing_1.Helpers.needsClosing.push(hero);
        await expect(hero.activeTab.cookieStorage.setItem('test', 'test')).rejects.toThrow("Chrome won't allow you to set cookies on a blank tab.");
    });
    it('can get and set localStorage', async () => {
        const hero = new hero_testing_1.Hero();
        hero_testing_1.Helpers.needsClosing.push(hero);
        await hero.goto(`${koaServer.baseUrl}/`);
        const localStorage = hero.activeTab.localStorage;
        expect(await localStorage.length).toBe(0);
        await localStorage.setItem('Test1', 'here');
        expect(await localStorage.length).toBe(1);
        await expect(hero.getJsValue('localStorage.getItem("Test1")')).resolves.toBe('here');
        expect(await localStorage.key(0)).toBe('Test1');
        await localStorage.removeItem('Test1');
        expect(await localStorage.length).toBe(0);
    });
    it('should not emit max event listeners warning', async () => {
        const warningHandler = jest.fn();
        const stdout = process.stdout.write.bind(process.stdout);
        process.stderr.write = (msg, cb) => {
            if (msg.includes('MaxListenersExceededWarning')) {
                warningHandler();
            }
            return stdout(msg, cb);
        };
        const promises = Array(30)
            .fill(0)
            .map(async () => {
            const hero = new hero_testing_1.Hero();
            hero_testing_1.Helpers.needsClosing.push(hero);
            await hero.goto(`${koaServer.baseUrl}/`);
            await hero.close();
        });
        await Promise.all(promises);
        process.stderr.write = stdout;
        expect(warningHandler).not.toHaveBeenCalled();
    });
    it('should run connections in parallel', async () => {
        const bridge = new TransportBridge_1.default();
        const connectionToCore = new hero_1.ConnectionToHeroCore(bridge.transportToCore);
        const heroCore = new hero_core_1.default({
            maxConcurrentClientCount: 10,
            maxConcurrentClientsPerBrowser: 10,
        });
        hero_testing_1.Helpers.needsClosing.push(heroCore);
        heroCore.addConnection(bridge.transportToClient);
        koaServer.get('/random-delay', async (ctx) => {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
            ctx.body = { test: true };
        });
        const resultOrder = [];
        await Promise.all(new Array(10).fill(0).map(async (_, i) => {
            const hero = new hero_testing_1.Hero({
                connectionToCore,
            });
            await hero.meta;
            await hero.goto(`${koaServer.baseUrl}/random-delay`);
            hero_testing_1.Helpers.needsClosing.push(hero);
            resultOrder.push(i);
        }));
        expect(resultOrder).toHaveLength(10);
        expect(resultOrder).not.toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
});
//# sourceMappingURL=basic.test.js.map