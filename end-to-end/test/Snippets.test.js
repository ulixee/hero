"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hero_testing_1 = require("@ulixee/hero-testing");
const internal_1 = require("@ulixee/hero/lib/internal");
let koaServer;
beforeAll(async () => {
    koaServer = await hero_testing_1.Helpers.runKoaServer();
});
afterAll(() => Promise.all([hero_testing_1.Helpers.afterAll(), hero_testing_1.Helpers.afterAll()]));
afterEach(() => Promise.all([hero_testing_1.Helpers.afterEach(), hero_testing_1.Helpers.afterEach()]));
describe('basic snippets tests', () => {
    it('collects snippets for extraction', async () => {
        const [hero] = await openBrowser();
        await hero.goto(`${koaServer.baseUrl}/`);
        await hero.setSnippet('data', { value: true });
        await hero.setSnippet('text', 'string');
        await hero.setSnippet('number', 1);
        await expect(hero.getSnippet('data')).resolves.toMatchObject({ value: true });
        await expect(hero.getSnippet('text')).resolves.toBe('string');
        await expect(hero.getSnippet('number')).resolves.toBe(1);
    });
});
async function openBrowser(path) {
    const hero = new hero_testing_1.Hero();
    const coreSession = await hero[internal_1.InternalPropertiesSymbol].coreSessionPromise;
    hero_testing_1.Helpers.needsClosing.push(hero);
    if (path) {
        await hero.goto(`${koaServer.baseUrl}${path}`);
        await hero.waitForPaintingStable();
    }
    return [hero, coreSession];
}
//# sourceMappingURL=Snippets.test.js.map