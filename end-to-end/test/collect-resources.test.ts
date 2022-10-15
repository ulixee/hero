import { Helpers, Hero } from '@ulixee/hero-testing';
import { InternalPropertiesSymbol } from '@ulixee/hero/lib/internal';
import CoreSession from '@ulixee/hero/lib/CoreSession';
import DetachedResources from '@ulixee/hero/lib/DetachedResources';

let koaServer: Helpers.ITestKoaServer;
beforeAll(async () => {
  koaServer = await Helpers.runKoaServer();
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
afterAll(() => Promise.all([Helpers.afterAll(), Helpers.afterAll()]));
afterEach(() => Promise.all([Helpers.afterEach(), Helpers.afterEach()]));

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
      await resources[0].$detach('xhr');

      const detachedResources = new DetachedResources(
        Promise.resolve(coreSession1),
        hero1.sessionId,
      );
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
      const detachedResources = new DetachedResources(
        Promise.resolve(coreSession2),
        hero1.sessionId,
      );
      const collected2 = await detachedResources.getAll('xhr');
      expect(collected2).toHaveLength(1);
      expect(collected2[0].url).toBe(`${koaServer.baseUrl}/ajax?counter=0`);
      // should prefetch the body
      expect(collected2[0].buffer).toBeTruthy();
    }
  });
});
