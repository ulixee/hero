import { Helpers } from '@ulixee/hero-testing';
import { ITestKoaServer } from '@ulixee/hero-testing/helpers';
import Hero from '../index';

let koaServer: ITestKoaServer;
beforeAll(async () => {
  koaServer = await Helpers.runKoaServer(true);
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic waitForLocation change detections', () => {
  it('runs basic flow', async () => {
    koaServer.get('/start', ctx => {
      ctx.body = `
        <body>
          <button>Click Me</button>
          <script>
            document.querySelector('button').addEventListener('click', () => {
              window.location = '/finish';
            });
          </script>
        </body>
      `;
    });
    koaServer.get('/finish', ctx => (ctx.body = `Finished!`));

    const startUrl = `${koaServer.baseUrl}/start`;
    const finishUrl = `${koaServer.baseUrl}/finish`;
    const hero = new Hero();

    await hero.goto(startUrl);
    const firstUrl = await hero.url;
    await hero.waitForPaintingStable();
    const button = hero.document.querySelector('button');
    await hero.waitForElement(button);

    await hero.interact({ click: button });
    await hero.waitForLocation('change');
    const lastUrl = await hero.url;

    expect(firstUrl).toBe(startUrl);
    expect(lastUrl).toBe(finishUrl);

    await hero.close();
  });

  it('should trigger a location change if location changed but also redirected', async () => {
    koaServer.get('/page1', ctx => {
      ctx.body = `
        <body>
          <a href="/page2">Click Me</a>
        </body>
      `;
    });
    koaServer.get('/page2', ctx => {
      ctx.redirect('/page3');
    });

    koaServer.get('/page3', ctx => {
      ctx.body = `
        <body>
          <a href="/page4">Click Me</a>
        </body>
      `;
    });

    koaServer.get('/page4', ctx => {
      ctx.redirect('/finish');
    });

    koaServer.get('/finish', ctx => (ctx.body = `Finished!`));
    const hero = new Hero();
    await hero.goto(`${koaServer.baseUrl}/page1`);
    const startlink = hero.document.querySelector('a');
    await hero.interact({ click: startlink, waitForElementVisible: startlink });
    await hero.waitForLocation('change');
    expect(await hero.url).toBe(`${koaServer.baseUrl}/page3`);

    const nextlink = hero.document.querySelector('a');
    await hero.interact({ click: nextlink, waitForElementVisible: nextlink });
    await hero.waitForLocation('change');
    expect(await hero.url).toBe(`${koaServer.baseUrl}/finish`);

    await hero.close();
  });

  it('should support 2 location changes', async () => {
    koaServer.get('/loc1', ctx => {
      ctx.body = `
        <body>
          <a href="/loc2">Click Me</a>
        </body>
      `;
    });
    koaServer.get('/loc2', ctx => {
      ctx.body = `
        <body>
          <a href="/loc3">Click Me</a>
        </body>
      `;
    });
    koaServer.get('/loc3', ctx => (ctx.body = `Finished!`));

    const startUrl = `${koaServer.baseUrl}/loc1`;
    const page2Url = `${koaServer.baseUrl}/loc2`;
    const finishUrl = `${koaServer.baseUrl}/loc3`;
    const hero = new Hero();

    await hero.goto(startUrl);
    const firstUrl = await hero.url;
    await hero.waitForPaintingStable();
    const readyLink = hero.document.querySelector('a');
    await hero.interact({ click: readyLink, waitForElementVisible: readyLink });
    await hero.waitForLocation('change');
    const secondUrl = await hero.url;
    await hero.waitForPaintingStable();

    const readyLink2 = hero.document.querySelector('a');
    await hero.interact({ click: readyLink2, waitForElementVisible: readyLink2 });
    await hero.waitForLocation('change');
    await hero.waitForPaintingStable();
    const lastUrl = await hero.url;

    expect(firstUrl).toBe(startUrl);
    expect(secondUrl).toBe(page2Url);
    expect(lastUrl).toBe(finishUrl);

    await hero.close();
  });

  it('should support timing out a location change', async () => {
    koaServer.get('/loaded1', ctx => {
      ctx.body = `
        <body>
          <a href="/loaded2">Click Me</a>
        </body>
      `;
    });
    koaServer.get('/loaded2', ctx => {
      ctx.body = `<body><h1>Loaded 2</h1></body>`;
    });

    const hero = new Hero();
    await hero.goto(`${koaServer.baseUrl}/loaded1`);
    await hero.waitForPaintingStable();
    const link = hero.document.querySelector('a');
    await hero.click(link);
    await hero.waitForLocation('change', { timeoutMs: 500 });
    await hero.waitForPaintingStable();
    expect(await hero.url).toBe(`${koaServer.baseUrl}/loaded2`);

    await expect(hero.waitForLocation('change', { timeoutMs: 500 })).rejects.toThrowError(
      'Timeout',
    );
    await hero.close();
  });

  it('can wait for a reload', async () => {
    let counter = 0;
    koaServer.get('/refresh', ctx => {
      if (counter === 0) {
        ctx.body = `
        <head><meta http-equiv = "refresh" content = "0; url = ${koaServer.baseUrl}/refresh" /></head>
        <body><h1>Hi</h1></body>
      `;
      } else {
        ctx.body = `
        <body><h1>Loaded</h1></body>
      `;
      }
      counter += 1;
    });
    const hero = new Hero();
    await hero.goto(`${koaServer.baseUrl}/refresh`);

    await expect(hero.waitForLocation('reload')).resolves.toBeTruthy();
  });

  it('will trigger reload if the same page is loaded again', async () => {
    let counter = 0;

    koaServer.post('/postback', ctx => {
      ctx.redirect('/postback');
    });

    koaServer.get('/postback', ctx => {
      if (counter === 0) {
        ctx.body = `
        <body>
        <h1>Hi</h1>
        <form action="/postback" method="post">
          <input type="submit" name="submit">
        </form>
        </body>
      `;
      } else {
        ctx.body = `<body><h1>Loaded</h1></body>`;
      }
      counter += 1;
    });
    const hero = new Hero();
    await hero.goto(`${koaServer.baseUrl}/postback`);
    await hero.click(hero.activeTab.document.querySelector('input'));

    await expect(hero.waitForLocation('reload')).resolves.toBeTruthy();
  });
});
