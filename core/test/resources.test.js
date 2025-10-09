"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hero_testing_1 = require("@ulixee/hero-testing");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const default_browser_emulator_1 = require("@ulixee/default-browser-emulator");
const index_1 = require("../index");
const Tab_1 = require("../lib/Tab");
let connection;
beforeAll(() => {
    const core = new index_1.default();
    connection = core.addConnection();
    hero_testing_1.Helpers.onClose(() => connection.disconnect(), true);
});
afterAll(hero_testing_1.Helpers.afterAll);
afterEach(hero_testing_1.Helpers.afterEach);
test('loads http2 resources', async () => {
    // no longer supported in chrome 106
    const isPushEnabled = Number(default_browser_emulator_1.defaultBrowserEngine.version.major) < 106;
    const server = await hero_testing_1.Helpers.runHttp2Server((req, res) => {
        if (req.url === '/img.png') {
            // NOTE: chrome will still request this even though it's pushed
            return res.destroy();
        }
        if (isPushEnabled) {
            res.stream.pushStream({
                ':path': '/img.png',
                ':method': 'GET',
            }, (err, pushStream) => {
                pushStream.respond({
                    ':status': 200,
                    'content-type': 'image/png',
                    'content-length': Buffer.byteLength(hero_testing_1.Helpers.getLogo()),
                });
                pushStream.end(hero_testing_1.Helpers.getLogo());
            });
        }
        else {
            expect(() => res.stream.pushStream({
                ':path': '/img.png',
                ':method': 'GET',
            }, (err, pushStream) => {
                pushStream.respond({
                    ':status': 200,
                    'content-type': 'image/png',
                    'content-length': Buffer.byteLength(hero_testing_1.Helpers.getLogo()),
                });
                pushStream.end(hero_testing_1.Helpers.getLogo());
            })).toThrow();
        }
        res.stream.respond({
            ':status': 200,
            'content-type': 'text/html',
        });
        res.stream.end(`<html><body><img src='/img.png'/></body></html>`);
    });
    const meta = await connection.createSession();
    const tab = index_1.Session.getTab(meta);
    const session = index_1.Session.get(meta.sessionId);
    hero_testing_1.Helpers.needsClosing.push(session);
    await tab.goto(server.url);
    await tab.waitForLoad('DomContentLoaded');
    if (isPushEnabled) {
        const resources = await tab.waitForResources({ url: /.*\/img.png/ });
        expect(resources).toHaveLength(1);
        expect(resources[0].type).toBe('Image');
    }
    await session.close();
});
test('records a single resource for failed mitm requests', async () => {
    const meta = await connection.createSession();
    const session = index_1.Session.get(meta.sessionId);
    hero_testing_1.Helpers.needsClosing.push(session);
    const tab = index_1.Session.getTab(meta);
    const waitForEmptyKeyCheck = new Resolvable_1.default();
    const didEmit = new Resolvable_1.default();
    const originalEmit = tab.page.emit.bind(tab.page);
    // @ts-ignore
    jest.spyOn(tab.page.networkManager, 'emit').mockImplementation((evt, args) => {
        // eslint-disable-next-line promise/always-return,promise/catch-or-return,@typescript-eslint/no-floating-promises
        waitForEmptyKeyCheck.promise.then(() => {
            originalEmit(evt, args);
        });
        if (evt === 'resource-loaded')
            didEmit.resolve();
        return true;
    });
    const goToPromise = tab.goto(`http://localhost:2344/not-there`);
    await expect(goToPromise).rejects.toThrow();
    // @ts-ignore
    const mitmErrorsByUrl = session.resources.mitmErrorsByUrl;
    expect(mitmErrorsByUrl.get(`http://localhost:2344/not-there`)).toHaveLength(1);
    expect(session.resources.getForTab(meta.tabId)).toHaveLength(1);
    expect([...session.resources.browserRequestIdToResources.keys()]).toHaveLength(0);
    waitForEmptyKeyCheck.resolve();
    await didEmit.promise;
    await new Promise(setImmediate);
    const resource = session.resources
        .getForTab(meta.tabId)
        .find(x => x.url === `http://localhost:2344/not-there`);
    expect(resource).toBeTruthy();
    expect([...session.resources.browserRequestIdToResources.keys()].length).toBeGreaterThanOrEqual(1);
    await session.close();
});
test('should convert a url with special chars into a valid regex', () => {
    const regexp = (0, Tab_1.stringToRegex)('https://fonts.com?family=Open+Sans:300,300i');
    expect('https://fonts.com?family=Open+Sans:300,300i'.match(regexp)).toBeTruthy();
});
test('should convert a url with wildcards into a valid regex', () => {
    const regexp = (0, Tab_1.stringToRegex)('https://www.skyscanner.com/g/conductor/v1/fps3/search/*');
    expect('https://www.skyscanner.com/g/conductor/v1/fps3/search/1234'.match(regexp)).toBeTruthy();
});
//# sourceMappingURL=resources.test.js.map