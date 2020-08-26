import { Helpers } from '@secret-agent/testing';
import SecretAgent from '../index';

beforeAll(async () => {
  await SecretAgent.start();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic waitForLocation change detections', () => {
  it('runs basic flow', async () => {
    const koaServer = await Helpers.runKoaServer(false);
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
    const browser = await SecretAgent.createBrowser();

    await browser.goto(startUrl);
    const firstUrl = await browser.url;
    await browser.waitForAllContentLoaded();
    const button = browser.document.querySelector('button');
    await browser.waitForElement(button);

    await browser.interact({ click: button });
    await browser.waitForLocation('change');
    const lastUrl = await browser.url;

    expect(firstUrl).toBe(startUrl);
    expect(lastUrl).toBe(finishUrl);

    await browser.close();
    await koaServer.close();
  });

  it('should trigger a location change if location changed but also redirected', async () => {
    const koaServer = await Helpers.runKoaServer(false);
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
    const browser = await SecretAgent.createBrowser();
    await browser.goto(`${koaServer.baseUrl}/page1`);
    const startlink = browser.document.querySelector('a');
    await browser.interact({ click: startlink, waitForElementVisible: startlink });
    await browser.waitForLocation('change');
    expect(await browser.url).toBe(`${koaServer.baseUrl}/page3`);

    const nextlink = browser.document.querySelector('a');
    await browser.interact({ click: nextlink, waitForElementVisible: nextlink });
    await browser.waitForLocation('change');
    expect(await browser.url).toBe(`${koaServer.baseUrl}/finish`);

    await browser.close();
    await koaServer.close();
  });

  it('should support 2 location changes', async () => {
    const koaServer = await Helpers.runKoaServer(false);
    koaServer.get('/page1', ctx => {
      ctx.body = `
        <body>
          <a href="/page2">Click Me</a>
        </body>
      `;
    });
    koaServer.get('/page2', ctx => {
      ctx.body = `
        <body>
          <a href="/finish">Click Me</a>
        </body>
      `;
    });
    koaServer.get('/finish', ctx => (ctx.body = `Finished!`));

    const startUrl = `${koaServer.baseUrl}/page1`;
    const page2Url = `${koaServer.baseUrl}/page2`;
    const finishUrl = `${koaServer.baseUrl}/finish`;
    const browser = await SecretAgent.createBrowser();

    await browser.goto(startUrl);
    const firstUrl = await browser.url;
    await browser.waitForAllContentLoaded();
    const readyLink = browser.document.querySelector('a');
    await browser.interact({ click: readyLink, waitForElementVisible: readyLink });
    await browser.waitForLocation('change');
    const secondUrl = await browser.url;
    await browser.waitForAllContentLoaded();

    const readyLink2 = browser.document.querySelector('a');
    await browser.interact({ click: readyLink2, waitForElementVisible: readyLink2 });
    await browser.waitForLocation('change');
    await browser.waitForAllContentLoaded();
    const lastUrl = await browser.url;

    expect(firstUrl).toBe(startUrl);
    expect(secondUrl).toBe(page2Url);
    expect(lastUrl).toBe(finishUrl);

    await browser.close();
    await koaServer.close();
  });
});
