import { Hero, Helpers } from '@ulixee/hero-testing';
import { ITestKoaServer } from '@ulixee/hero-testing/helpers';
import { InternalPropertiesSymbol } from '@ulixee/hero/lib/internal';
import Resource from '@ulixee/hero/lib/Resource';

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
    expect(findResource).toBeTruthy();
  });

  it('gets the resource back from a goto', async () => {
    const exampleUrl = `${koaServer.baseUrl}/`;
    const hero = new Hero({
      locale: 'en-US,en',
    });
    Helpers.needsClosing.push(hero);

    const resource = await hero.goto(exampleUrl);
    const { request, response } = resource;
    expect(await request.headers).toMatchObject({
      Host: koaServer.baseHost,
      Connection: 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': expect.any(String),
      Accept: expect.any(String),
      'Accept-Encoding': 'gzip, deflate',
      'Accept-Language': 'en-US,en;q=0.9',
    });
    expect(await request.url).toBe(exampleUrl);
    expect(await request.timestamp).toBeTruthy();
    expect(await request.method).toBe('GET');
    expect(await request.postData).toBeNull();

    expect(await response.headers).toMatchObject({
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': expect.any(String),
      Date: expect.any(String),
      Connection: 'keep-alive',
    });
    expect(await response.url).toBe(exampleUrl);
    expect(await response.timestamp).toBeTruthy();
    expect(await response.remoteAddress).toBeTruthy();
    expect(await response.statusCode).toBe(200);
    expect(await response.statusMessage).toBe('OK');
    expect(await response.text).toMatch('<h1>Example Domain</h1>');
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
    ).resolves.toStrictEqual(resources2[0]);

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
      await coreTab.detachResource('xhr', resourceMeta.id);

      const collected = await coreSession1.getDetachedResources(await hero1.sessionId, 'xhr');
      expect(collected).toHaveLength(1);
      expect(JSON.parse(collected[0].resource.response.buffer.toString())).toEqual({ hi: 'there' });
      await hero1.close();
    }

    // Test that we can load a previous session too
    {
      const hero2 = new Hero();
      Helpers.needsClosing.push(hero2);

      await hero2.goto(`${koaServer.baseUrl}`);
      await hero2.waitForPaintingStable();
      const coreSession2 = await hero2[InternalPropertiesSymbol].coreSessionPromise;
      const collected2 = await coreSession2.getDetachedResources(await hero1.sessionId, 'xhr');
      expect(collected2).toHaveLength(1);
      expect(collected2[0].resource.url).toBe(`${koaServer.baseUrl}/ajax?counter=0`);
      // should prefetch the body
      expect(collected2[0].resource.response.buffer).toBeTruthy();
    }
  });
  it('allows you to block resources', async () => {
    koaServer.get('/block', ctx => {
      ctx.body = `<html>
<head>
  <link rel="stylesheet" href="/test.css" />
</head>
<body>
  <img src="/img.png" alt="Image"/>
</body>
</html>`;
    });

    koaServer.get('/img.png', ctx => {
      ctx.statusCode = 500;
    });
    koaServer.get('/test.css', ctx => {
      ctx.statusCode = 500;
    });

    const hero = new Hero({
      blockedResourceTypes: ['BlockAssets'],
    });
    Helpers.needsClosing.push(hero);

    const resources: Resource[] = [];
    await hero.activeTab.on('resource', event => resources.push(event as any));
    await hero.goto(`${koaServer.baseUrl}/block`);
    await hero.waitForPaintingStable();
    await new Promise(setImmediate);
    expect(resources).toHaveLength(1);
    expect(await resources[0].response.statusCode).toBe(200);
    expect(resources[0].type).toBe('Document');
  });

  it('allows you to block urls: strings', async () => {
    koaServer.get('/block-strings', ctx => {
      ctx.body = `<html>
<head>
  <link rel="stylesheet" href="/foo/bar/42.css?x=foo&y=%20baz" />
</head>
<body>
  <img src="/baz/bar.png" alt="Image"/>
</body>
</html>`;
    });

    koaServer.get('/foo/bar/42.css?x=foo&y=%20baz', ctx => {
      ctx.statusCode = 500;
    });
    koaServer.get('/baz/bar.png', ctx => {
      ctx.statusCode = 500;
    });

    const hero = new Hero({
      blockedResourceUrls: ['42.css?x=foo', '/baz/'],
    });
    Helpers.needsClosing.push(hero);

    const resources: Resource[] = [];
    await hero.activeTab.on('resource', event => resources.push(event as any));
    await hero.goto(`${koaServer.baseUrl}/block-strings`);
    await hero.waitForPaintingStable();
    await new Promise(setImmediate);
    expect(resources).toHaveLength(1);
    expect(await resources[0].response.statusCode).toBe(200);
    expect(resources[0].type).toBe('Document');
  });

  it('allows you to block urls: RegExp', async () => {
    koaServer.get('/block-regexes', ctx => {
      ctx.body = `<html>
<head>
  <link rel="stylesheet" href="/foo/bar/42.css?x=foo&y=%20baz" />
</head>
<body>
  <img src="/baz/bar.png" alt="Image"/>
</body>
</html>`;
    });

    koaServer.get('/foo/bar/42.css?x=foo&y=%20baz', ctx => {
      ctx.statusCode = 500;
    });
    koaServer.get('/baz/bar.png', ctx => {
      ctx.statusCode = 500;
    });

    const hero = new Hero({
      blockedResourceUrls: [/.*\?x=foo/, /\/baz\//],
    });
    Helpers.needsClosing.push(hero);

    const resources: Resource[] = [];
    await hero.activeTab.on('resource', event => resources.push(event as any));
    await hero.goto(`${koaServer.baseUrl}/block-regexes`);
    await hero.waitForPaintingStable();
    await new Promise(setImmediate);
    expect(resources).toHaveLength(1);
    expect(await resources[0].response.statusCode).toBe(200);
    expect(resources[0].type).toBe('Document');
  });
});
