"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hero_testing_1 = require("@ulixee/hero-testing");
const internal_1 = require("@ulixee/hero/lib/internal");
const DetachedResources_1 = require("@ulixee/hero/lib/DetachedResources");
let koaServer;
beforeAll(async () => {
    koaServer = await hero_testing_1.Helpers.runKoaServer();
    koaServer.get('/resources-test', ctx => {
        ctx.body = `<html>
<body>
<a onclick="clicker()" href="#nothing">Click me</a>
</body>
<script>
  let counter = 0
  function clicker() {
    fetch('/ajax?counter=' + (counter++) );
    return false;
  }
</script>
</html>`;
    });
    koaServer.get('/ajax', ctx => {
        ctx.body = {
            hi: 'there',
        };
    });
});
afterAll(() => Promise.all([hero_testing_1.Helpers.afterAll(), hero_testing_1.Helpers.afterAll()]));
afterEach(() => Promise.all([hero_testing_1.Helpers.afterEach(), hero_testing_1.Helpers.afterEach()]));
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
describe('basic resource tests', () => {
    it('collects resources for extraction', async () => {
        const [hero1, coreSession1] = await openBrowser();
        {
            await hero1.goto(`${koaServer.baseUrl}/resources-test`);
            await hero1.waitForPaintingStable();
            const elem = hero1.document.querySelector('a');
            await hero1.click(elem);
            const resources = await hero1.waitForResources({ type: 'Fetch' });
            expect(resources).toHaveLength(1);
            await resources[0].$addToDetachedResources('xhr');
            const detachedResources = new DetachedResources_1.default(Promise.resolve(coreSession1), hero1.sessionId);
            const collected = await detachedResources.getAll('xhr');
            expect(collected).toHaveLength(1);
            expect(collected[0].json).toEqual({ hi: 'there' });
            await hero1.close();
        }
        // Test that we can load a previous session too
        {
            const [hero2, coreSession2] = await openBrowser();
            await hero2.goto(`${koaServer.baseUrl}`);
            await hero2.waitForPaintingStable();
            const detachedResources = new DetachedResources_1.default(Promise.resolve(coreSession2), hero1.sessionId);
            const collected2 = await detachedResources.getAll('xhr');
            expect(collected2).toHaveLength(1);
            expect(collected2[0].url).toBe(`${koaServer.baseUrl}/ajax?counter=0`);
            // should prefetch the body
            expect(collected2[0].buffer).toBeTruthy();
        }
    });
});
//# sourceMappingURL=DetachedResources.test.js.map