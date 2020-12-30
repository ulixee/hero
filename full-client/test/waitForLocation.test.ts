import { Helpers } from '@secret-agent/testing';
import { ITestKoaServer } from '@secret-agent/testing/helpers';
import { Handler } from '../index';

let handler: Handler;
let koaServer: ITestKoaServer;
beforeAll(async () => {
  handler = new Handler();
  koaServer = await Helpers.runKoaServer(true);
  Helpers.onClose(() => handler.close(), true);
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
    const agent = await handler.createAgent();

    await agent.goto(startUrl);
    const firstUrl = await agent.url;
    await agent.waitForAllContentLoaded();
    const button = agent.document.querySelector('button');
    await agent.waitForElement(button);

    await agent.interact({ click: button });
    await agent.waitForLocation('change');
    const lastUrl = await agent.url;

    expect(firstUrl).toBe(startUrl);
    expect(lastUrl).toBe(finishUrl);

    await agent.close();
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
    const agent = await handler.createAgent();
    await agent.goto(`${koaServer.baseUrl}/page1`);
    const startlink = agent.document.querySelector('a');
    await agent.interact({ click: startlink, waitForElementVisible: startlink });
    await agent.waitForLocation('change');
    expect(await agent.url).toBe(`${koaServer.baseUrl}/page3`);

    const nextlink = agent.document.querySelector('a');
    await agent.interact({ click: nextlink, waitForElementVisible: nextlink });
    await agent.waitForLocation('change');
    expect(await agent.url).toBe(`${koaServer.baseUrl}/finish`);

    await agent.close();
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
    const agent = await handler.createAgent();

    await agent.goto(startUrl);
    const firstUrl = await agent.url;
    await agent.waitForAllContentLoaded();
    const readyLink = agent.document.querySelector('a');
    await agent.interact({ click: readyLink, waitForElementVisible: readyLink });
    await agent.waitForLocation('change');
    const secondUrl = await agent.url;
    await agent.waitForAllContentLoaded();

    const readyLink2 = agent.document.querySelector('a');
    await agent.interact({ click: readyLink2, waitForElementVisible: readyLink2 });
    await agent.waitForLocation('change');
    await agent.waitForAllContentLoaded();
    const lastUrl = await agent.url;

    expect(firstUrl).toBe(startUrl);
    expect(secondUrl).toBe(page2Url);
    expect(lastUrl).toBe(finishUrl);

    await agent.close();
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
      ctx.body = `<body></body>`;
    });

    const agent = await handler.createAgent();

    await agent.goto(`${koaServer.baseUrl}/loaded1`);
    await agent.waitForAllContentLoaded();
    const link = agent.document.querySelector('a');
    await agent.click(link);
    await agent.waitForLocation('change', { timeoutMs: 500 });
    await agent.waitForAllContentLoaded();
    expect(await agent.url).toBe(`${koaServer.baseUrl}/loaded2`);

    await expect(agent.waitForLocation('change', { timeoutMs: 500 })).rejects.toThrowError(
      'Timeout',
    );
    await agent.close();
  });
});
