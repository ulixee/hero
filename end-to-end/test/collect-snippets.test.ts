import { Helpers, Hero } from '@ulixee/hero-testing';
import { InternalPropertiesSymbol } from '@ulixee/hero/lib/internal';
import CoreSession from '@ulixee/hero/lib/CoreSession';

let koaServer: Helpers.ITestKoaServer;
beforeAll(async () => {
  koaServer = await Helpers.runKoaServer();
});
afterAll(() => Promise.all([Helpers.afterAll(), Helpers.afterAll()]));
afterEach(() => Promise.all([Helpers.afterEach(), Helpers.afterEach()]));

describe('basic snippets tests', () => {
  it('collects snippets for extraction', async () => {
    const [hero] = await openBrowser();
    await hero.goto(`${koaServer.baseUrl}/`);

    await hero.collect('data', { value: true });
    await hero.collect('text', 'string');
    await hero.collect('number', 1);

    await expect(hero.collectedSnippets.get('data')).resolves.toMatchObject({ value: true });
    await expect(hero.collectedSnippets.get('text')).resolves.toBe('string');
    await expect(hero.collectedSnippets.get('number')).resolves.toBe(1);
  });
});

async function openBrowser(path?: string): Promise<[Hero, CoreSession]> {
  const hero = new Hero();
  const coreSession = await hero[InternalPropertiesSymbol].coreSessionPromise;
  Helpers.needsClosing.push(hero);
  if (path) {
    await hero.goto(`${koaServer.baseUrl}${path}`);
    await hero.waitForPaintingStable();
  }
  return [hero, coreSession];
}