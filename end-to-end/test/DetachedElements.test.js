"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hero_testing_1 = require("@ulixee/hero-testing");
const internal_1 = require("@ulixee/hero/lib/internal");
const hero_1 = require("@ulixee/hero");
let koaServer;
beforeAll(async () => {
    koaServer = await hero_testing_1.Helpers.runKoaServer();
});
afterAll(() => Promise.all([hero_testing_1.Helpers.afterAll(), hero_testing_1.Helpers.afterAll()]));
afterEach(() => Promise.all([hero_testing_1.Helpers.afterEach(), hero_testing_1.Helpers.afterEach()]));
describe('basic Element tests', () => {
    it('can extract elements', async () => {
        koaServer.get('/element-basic', ctx => {
            ctx.body = `
        <body>
          <div class="test1">test 1</div>
          <div class="test2">
            <ul><li>Test 2</li></ul>
          </div>
        </body>
      `;
        });
        const [hero] = await openBrowser(`/element-basic`);
        const test1Element = await hero.document.querySelector('.test1');
        await test1Element.$addToDetachedElements('a');
        await test1Element.nextElementSibling.$addToDetachedElements('b');
        const heroReplay = new hero_1.HeroReplay({ hero });
        const elementsA = await heroReplay.detachedElements.getAll('a');
        expect(elementsA).toHaveLength(1);
        expect(elementsA[0].outerHTML).toBe('<div class="test1">test 1</div>');
        const heroReplayWithSessionId = new hero_1.HeroReplay({
            replaySessionId: await hero.sessionId,
            connectionToCore: hero_testing_1.Hero.getDirectConnectionToCore(),
        });
        const elementsB = await heroReplayWithSessionId.detachedElements.getAll('b');
        expect(elementsB[0].outerHTML).toBe(`<div class="test2">
            <ul><li>Test 2</li></ul>
          </div>`);
        await expect(hero.detachedElements.names).resolves.toMatchObject(['a', 'b']);
    });
    it('can extract selectorAll lists', async () => {
        koaServer.get('/element-list', ctx => {
            ctx.body = `
        <body>

            <ul>
              <li class="valid">Test 1</li>
              <li class="invalid">Test 2</li>
              <li class="invalid">Test 3</li>
              <li class="valid">Test 4</li>
              <li class="valid">Test 5</li>
            </ul>
        </body>
      `;
        });
        const [hero] = await openBrowser(`/element-list`);
        const sessionId = await hero.sessionId;
        await hero.document.querySelectorAll('.valid').$addToDetachedElements('valid');
        await expect(hero.detachedElements.names).resolves.toMatchObject(['valid']);
        await hero.close();
        const heroReplay = new hero_1.HeroReplay({
            replaySessionId: sessionId,
            connectionToCore: hero_testing_1.Hero.getDirectConnectionToCore(),
        });
        const valid = await heroReplay.detachedElements.getAll('valid');
        expect(valid).toHaveLength(3);
        expect(valid[0].outerHTML).toBe('<li class="valid">Test 1</li>');
        expect(valid[1].outerHTML).toBe('<li class="valid">Test 4</li>');
        expect(valid[2].outerHTML).toBe('<li class="valid">Test 5</li>');
        await expect(heroReplay.detachedElements.names).resolves.toMatchObject(['valid']);
    });
});
async function openBrowser(path) {
    const hero = new hero_testing_1.Hero();
    const coreSession = await hero[internal_1.InternalPropertiesSymbol].coreSessionPromise;
    hero_testing_1.Helpers.needsClosing.push(hero);
    await hero.goto(`${koaServer.baseUrl}${path}`);
    await hero.waitForPaintingStable();
    return [hero, coreSession];
}
//# sourceMappingURL=DetachedElements.test.js.map