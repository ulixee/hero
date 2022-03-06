import { Helpers } from '@ulixee/hero-testing';
import { ITestKoaServer } from '@ulixee/hero-testing/helpers';
import Hero from '../index';
import { InternalPropertiesSymbol } from '@ulixee/hero/lib/internal';

let koaServer: ITestKoaServer;
beforeAll(async () => {
  koaServer = await Helpers.runKoaServer();
  koaServer.get('/resources-test', ctx => {
    ctx.body = `<html>
<body>
<a onclick="clicker()" href="#nothing">Click me</a>
</body>
<script>
  let counter = 0;
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
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic resource tests', () => {
  it('waits for a resource', async () => {
    const exampleUrl = `${koaServer.baseUrl}/resources-test`;
    const hero = new Hero();
    Helpers.needsClosing.push(hero);

    await hero.goto(exampleUrl);
    await hero.waitForPaintingStable();
    const elem = hero.document.querySelector('a');
    await hero.click(elem);

    const resources = await hero.waitForResources({ type: 'Fetch' });
    expect(resources).toHaveLength(1);

    const findResource = await hero.findResource({ type: 'Fetch' });
    expect(findResource).toBeTruthy()
  });

  it('waits for resources by default since the previous command', async () => {
    const exampleUrl = `${koaServer.baseUrl}/resources-test`;
    const hero = new Hero();
    Helpers.needsClosing.push(hero);

    await hero.goto(exampleUrl);
    await hero.waitForPaintingStable();
    const elem = await hero.document.querySelector('a');
    const startCommandId = await hero.lastCommandId;
    await hero.click(elem);

    let sinceCommandId = await hero.lastCommandId;
    const resources = await hero.waitForResources({ type: 'Fetch' });
    expect(resources).toHaveLength(1);

    await expect(
      hero.waitForResource({ type: 'Fetch' }, { sinceCommandId }),
    ).resolves.toStrictEqual(resources[0]);

    await hero.interact({ move: elem });
    await hero.click(elem);

    sinceCommandId = await hero.lastCommandId;
    const resources2 = await hero.waitForResources({ type: 'Fetch' });
    expect(resources2).toHaveLength(1);
    await expect(
      hero.waitForResource({ type: 'Fetch' }, { sinceCommandId }),
    ).resolves.toStrictEqual(resources[0]);

    let counter = 0;
    const allResources = await hero.waitForResources(
      {
        filterFn: (resource, done) => {
          if (resource.type === 'Fetch') {
            counter += 1;
            if (counter === 2) done();
            return true;
          }
          return false;
        },
      },
      { sinceCommandId: startCommandId },
    );
    expect(allResources).toHaveLength(2);
    await hero.close();
  });

  it('waits for a resource loaded since a previous command id', async () => {
    const exampleUrl = `${koaServer.baseUrl}/resources-test`;
    const hero = new Hero();
    Helpers.needsClosing.push(hero);

    await hero.goto(exampleUrl);
    await hero.waitForPaintingStable();
    let lastCommandId: number;
    for (let i = 0; i <= 4; i += 1) {
      const elem = hero.document.querySelector('a');
      await hero.click(elem);
      const resources = await hero.waitForResources(
        { type: 'Fetch' },
        { sinceCommandId: lastCommandId },
      );
      lastCommandId = await hero.lastCommandId;
      expect(resources).toHaveLength(1);
      expect(resources[0].url).toContain(`counter=${i}`);
    }

    await expect(hero.findResources({ type: 'Fetch' })).resolves.toHaveLength(5);
  });

  it('can find resources', async () => {
    const exampleUrl = `${koaServer.baseUrl}/resources-test`;
    const hero = new Hero();
    Helpers.needsClosing.push(hero);

    await hero.goto(exampleUrl);
    await hero.waitForPaintingStable();
    const elem = hero.document.querySelector('a');
    await hero.click(elem);

    await hero.waitForResource({ url: '/ajax?counter' });
    await expect(hero.findResource({ url: '/ajax?counter=0' })).resolves.toBeTruthy();
  });

  it('cancels a pending resource on hero close', async () => {
    const exampleUrl = `${koaServer.baseUrl}/resources-test`;
    const hero = new Hero();
    Helpers.needsClosing.push(hero);

    await hero.goto(exampleUrl);

    const waitForResource = hero.waitForResource({ type: 'Fetch' });
    // eslint-disable-next-line jest/valid-expect
    const waitError = expect(waitForResource).rejects.toThrowError('disconnected');
    await hero.close();
    await waitError;
  });

  it('collects resources for extraction', async () => {
    const hero1 = new Hero();
    Helpers.needsClosing.push(hero1);
    {
      await hero1.goto(`${koaServer.baseUrl}/resources-test`);
      await hero1.waitForPaintingStable();
      const elem = hero1.document.querySelector('a');
      await hero1.click(elem);

      const resource = await hero1.waitForResource({ type: 'Fetch' });
      expect(resource).toBeTruthy();
      const coreSession1 = await hero1[InternalPropertiesSymbol].coreSessionPromise;
      const { resourceMeta, coreTabPromise } = resource[InternalPropertiesSymbol];
      const coreTab = await coreTabPromise;
      await coreTab.collectResource('xhr', resourceMeta.id);

      const collected = await coreSession1.getCollectedResources(await hero1.sessionId, 'xhr');
      expect(collected).toHaveLength(1);
      expect(collected[0].response.json).toEqual({ hi: 'there' });
      await hero1.close();
    }

    // Test that we can load a previous session too
    {
      const hero2 = new Hero();
      Helpers.needsClosing.push(hero2);

      await hero2.goto(`${koaServer.baseUrl}`);
      await hero2.waitForPaintingStable();
      const coreSession2 = await hero2[InternalPropertiesSymbol].coreSessionPromise;
      const collected2 = await coreSession2.getCollectedResources(await hero1.sessionId, 'xhr');
      expect(collected2).toHaveLength(1);
      expect(collected2[0].url).toBe(`${koaServer.baseUrl}/ajax?counter=0`);
      // should prefetch the body
      expect(collected2[0].response.buffer).toBeTruthy();
    }
  });
});
