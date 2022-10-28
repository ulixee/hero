import { Helpers, Hero } from '@ulixee/hero-testing';
import { InternalPropertiesSymbol } from '@ulixee/hero/lib/internal';
import CoreSession from '@ulixee/hero/lib/CoreSession';
import { HeroReplay } from '@ulixee/hero';

let koaServer: Helpers.ITestKoaServer;
beforeAll(async () => {
  koaServer = await Helpers.runKoaServer();
});
afterAll(() => Promise.all([Helpers.afterAll(), Helpers.afterAll()]));
afterEach(() => Promise.all([Helpers.afterEach(), Helpers.afterEach()]));

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

    const heroReplay = new HeroReplay({ hero });
    const elementsA = await heroReplay.detachedElements.getAll('a');
    expect(elementsA).toHaveLength(1);
    expect(elementsA[0].outerHTML).toBe('<div class="test1">test 1</div>');

    const heroReplayWithSessionId = new HeroReplay({
      replaySessionId: await hero.sessionId,
      connectionToCore: Hero.getDirectConnectionToCore(),
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

    const heroReplay = new HeroReplay({
      replaySessionId: sessionId,
      connectionToCore: Hero.getDirectConnectionToCore(),
    });
    const valid = await heroReplay.detachedElements.getAll('valid');
    expect(valid).toHaveLength(3);
    expect(valid[0].outerHTML).toBe('<li class="valid">Test 1</li>');
    expect(valid[1].outerHTML).toBe('<li class="valid">Test 4</li>');
    expect(valid[2].outerHTML).toBe('<li class="valid">Test 5</li>');

    await expect(heroReplay.detachedElements.names).resolves.toMatchObject(['valid']);
  });
});

async function openBrowser(path: string): Promise<[Hero, CoreSession]> {
  const hero = new Hero();
  const coreSession = await hero[InternalPropertiesSymbol].coreSessionPromise;
  Helpers.needsClosing.push(hero);
  await hero.goto(`${koaServer.baseUrl}${path}`);
  await hero.waitForPaintingStable();
  return [hero, coreSession];
}
