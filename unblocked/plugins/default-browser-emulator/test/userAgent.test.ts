import * as Fs from 'fs';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import Pool from '@unblocked-web/agent/lib/Pool';
import { Helpers, TestLogger } from '@unblocked-web/agent-testing';
import { ITestKoaServer } from '@unblocked-web/agent-testing/helpers';
import BrowserEmulator, { defaultBrowserEngine } from '../index';

let koaServer: ITestKoaServer;
let pool: Pool;

const logger = TestLogger.forTest(module);

const chromeVersion = defaultBrowserEngine.version.major;

beforeEach(Helpers.beforeEach);
beforeAll(async () => {
  pool = new Pool({ plugins: [BrowserEmulator] });
  Helpers.onClose(() => pool.close(), true);
  await pool.start();
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('user agent and platform', () => {
  const propsToGet = [
    `appVersion`,
    `platform`,
    `userAgent`,
    `deviceMemory`,
    `userAgentData.mobile`,
    `userAgentData.platform`,
    `userAgentData.brands`,
  ];

  it('should be able to configure a userAgent', async () => {
    const userAgentSelector = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion}.0.4389.114 Safari/537.36`;
    const agent = pool.createAgent({
      logger,
      customEmulatorConfig: { userAgentSelector },
    });
    Helpers.needsClosing.push(agent);
    const agentMeta = await agent.emulationProfile.userAgentOption;
    expect(agentMeta.string).toBe(userAgentSelector);
  });

  it('should be able to configure a userAgent with a range', async () => {
    const agent = pool.createAgent({
      logger,
      customEmulatorConfig: {
        userAgentSelector: `~ chrome >= ${chromeVersion} && chrome < ${Number(chromeVersion) + 1}`,
      },
    });
    Helpers.needsClosing.push(agent);

    const agentMeta = await agent.emulationProfile.userAgentOption;
    const chromeMatch = agentMeta.string.match(/Chrome\/(\d+)/);
    expect(chromeMatch).toBeTruthy();
    const version = Number(chromeMatch[1]);
    expect(version).toBe(Number(chromeVersion));
  });

  it('should be able to configure a userAgent with a wildcard', async () => {
    const agent = pool.createAgent({
      logger,
      customEmulatorConfig: {
        userAgentSelector: `~ chrome = ${chromeVersion}.x`,
      },
    });
    Helpers.needsClosing.push(agent);

    const agentMeta = await agent.emulationProfile.userAgentOption;
    const chromeMatch = agentMeta.string.match(/Chrome\/(\d+)/);
    expect(chromeMatch).toBeTruthy();
    const version = Number(chromeMatch[1]);
    expect(version).toBe(Number(chromeVersion));
  });

  it('should add user agent and platform to window & frames', async () => {
    const agent = pool.createAgent({ logger });
    Helpers.needsClosing.push(agent);

    const agentMeta = await agent.emulationProfile.userAgentOption;

    const requestUserAgentStrings: string[] = [];

    koaServer.get('/agent-test', (ctx) => {
      requestUserAgentStrings.push(ctx.get('user-agent'));
      ctx.body = `<html lang="en">
<h1>Agent Test</h1>
<iframe src="/frame"></iframe>
</html>`;
    });

    koaServer.get('/frame', (ctx) => {
      requestUserAgentStrings.push(ctx.get('user-agent'));
      ctx.body = `<html><body>
<script>
  const data = {
    ${propsToGet.map((x) => `'${x}': navigator.${x}`).join(',\n')}
  };
  
  navigator.userAgentData.getHighEntropyValues(['platformVersion', 'architecture', 'bitness', 'model', 'uaFullVersion'])
  .then(extras => {
    return fetch('${koaServer.baseUrl}/frame-xhr', {
      method: 'POST',
      body: JSON.stringify({...data, ...extras})
    });
  })

</script>
</body></html>`;
    });

    const frameXhr = new Promise<object>((resolve) => {
      koaServer.post('/frame-xhr', async (ctx) => {
        requestUserAgentStrings.push(ctx.get('user-agent'));
        const body = JSON.parse((await Helpers.readableToBuffer(ctx.req)).toString());
        resolve(body);
        ctx.body = 'Ok';
      });
    });

    /////// TEST BEGIN /////

    const page = await agent.newPage();
    await page.goto(`${koaServer.baseUrl}/agent-test`);
    const frameParams = await frameXhr;

    for (const useragent of requestUserAgentStrings) {
      expect(useragent).toBe(agentMeta.string);
    }

    const windowParams: any = {};
    for (const prop of propsToGet) {
      windowParams[prop] = await page.evaluate(`navigator.${prop}`);
    }

    expect(agentMeta.string).toBe(windowParams.userAgent);
    expect(agentMeta.operatingSystemPlatform).toBe(windowParams.platform);

    for (const prop of propsToGet) {
      expect(`${prop}=${frameParams[prop]}`).toStrictEqual(`${prop}=${windowParams[prop]}`);
    }
    const extras = await page.evaluate(
      `navigator.userAgentData.getHighEntropyValues(['platformVersion', 'architecture', 'bitness', 'model', 'uaFullVersion'])`,
    );
    for (const [prop, value] of Object.entries(extras)) {
      expect(`${prop}=${frameParams[prop]}`).toStrictEqual(`${prop}=${value}`);
    }
  });

  it('should maintain user agent and platform across navigations', async () => {
    const agent = pool.createAgent({ logger });
    Helpers.needsClosing.push(agent);

    const agentMeta = await agent.emulationProfile.userAgentOption;

    const requestUserAgentStrings: string[] = [];

    const httpsServer = await Helpers.runHttpsServer(async (req, res) => {
      requestUserAgentStrings.push(req.headers['user-agent']);
      if (req.url === '/s2-page1') {
        res.end(
          `<html lang="en">
<script>
  var startPageVars = {
    ${propsToGet.map((x) => `'${x}': navigator.${x}`).join(',\n')}
  };
</script>
<body><a href="${koaServer.baseUrl}/page2">link</a></body></html>`,
        );
      } else {
        res.writeHead(404).end();
      }
    });

    koaServer.get('/page1', (ctx) => {
      requestUserAgentStrings.push(ctx.get('user-agent'));
      ctx.body = `<html lang="en"><body><a href="${httpsServer.baseUrl}/s2-page1">link</a></body></html>`;
    });

    koaServer.get('/page2', (ctx) => {
      requestUserAgentStrings.push(ctx.get('user-agent'));
      ctx.body = `<html lang="en"><body><h1>Last Page</h1></body></html>`;
    });
    const page = await agent.newPage();

    async function getParams() {
      const windowParams: any = {};
      for (const prop of propsToGet) {
        windowParams[prop] = await page.evaluate(`navigator.${prop}`);
      }
      return windowParams;
    }

    await page.goto(`${koaServer.baseUrl}/page1`);

    const page1WindowParams = await getParams();

    expect(agentMeta.string).toBe(page1WindowParams.userAgent);
    expect(agentMeta.operatingSystemPlatform).toBe(page1WindowParams.platform);

    await page.click('a');

    const page2WindowParams = await getParams();
    for (const prop of propsToGet) {
      expect(`${prop}=${page2WindowParams[prop]}`).toStrictEqual(
        `${prop}=${page1WindowParams[prop]}`,
      );
    }

    const page2StartParams = await page.evaluate('startPageVars');
    for (const prop of propsToGet) {
      expect(`${prop}=${page2StartParams[prop]}`).toStrictEqual(
        `${prop}=${page1WindowParams[prop]}`,
      );
    }

    await page.click('a');
    const page3WindowParams = await getParams();
    for (const key of propsToGet) {
      expect(page3WindowParams[key]).toStrictEqual(page1WindowParams[key]);
    }

    await page.goBack();
    const backParams = await getParams();
    for (const key of propsToGet) {
      expect(backParams[key]).toStrictEqual(page1WindowParams[key]);
    }
    for (const useragent of requestUserAgentStrings) {
      expect(useragent).toStrictEqual(agentMeta.string);
    }
  });

  it('should add user agent and platform to dedicated workers', async () => {
    const agent = pool.createAgent({ logger });
    Helpers.needsClosing.push(agent);

    const agentMeta = await agent.emulationProfile.userAgentOption;

    const requestUserAgentStrings: string[] = [];

    koaServer.get('/workers-test', (ctx) => {
      requestUserAgentStrings.push(ctx.get('user-agent'));
      ctx.body = `<html lang="en">
<script>new Worker("worker.js").postMessage('');</script>
</html>`;
    });

    koaServer.get('/worker.js', (ctx) => {
      requestUserAgentStrings.push(ctx.get('user-agent'));
      ctx.set('content-type', 'application/javascript');
      ctx.body = `onmessage = () => {

  const data = {
    ${propsToGet.map((x) => `'${x}': navigator.${x}`).join(',\n')}
  };
  fetch('/worker-xhr', {
   method: 'POST',
   body: JSON.stringify(data)
  });
}`;
    });

    const xhr = new Promise<object>((resolve) => {
      koaServer.post('/worker-xhr', async (ctx) => {
        requestUserAgentStrings.push(ctx.get('user-agent'));
        const body = JSON.parse((await Helpers.readableToBuffer(ctx.req)).toString());
        resolve(body);
        ctx.body = 'Ok';
      });
    });

    const page = await agent.newPage();
    await page.goto(`${koaServer.baseUrl}/workers-test`);
    const params = await xhr;

    for (const useragent of requestUserAgentStrings) {
      expect(useragent).toBe(agentMeta.string);
    }

    for (const prop of propsToGet) {
      const windowValue = await page.evaluate(`navigator.${prop}`);
      expect(params[prop]).toStrictEqual(windowValue);
      expect(`${prop}=${params[prop]}`).toStrictEqual(`${prop}=${windowValue}`);
    }
  });

  it('should add user agent and platform to service workers', async () => {
    const agent = pool.createAgent({ logger });
    Helpers.needsClosing.push(agent);

    const agentMeta = await agent.emulationProfile.userAgentOption;

    const requestUserAgentStrings: string[] = [];

    koaServer.get('/sw-test', (ctx) => {
      requestUserAgentStrings.push(ctx.get('user-agent'));
      ctx.body = `<html lang="en">
<h1>Service Worker Test</h1>
<script>
    navigator.serviceWorker.register('./service-worker.js');
    navigator.serviceWorker.ready.then((reg) => {
      if (reg.active) {
        reg.active.postMessage("send");
      }
    });
    navigator.serviceWorker.addEventListener("message", (event) => {
      fetch('/service-xhr', {
        method: 'POST',
        body: event.data
      });
   });
</script>
</html>`;
    });

    koaServer.get('/service-worker.js', (ctx) => {
      requestUserAgentStrings.push(ctx.get('user-agent'));
      ctx.set('content-type', 'application/javascript');
      ctx.body = `
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', async event => {
  if (event.data !== 'send') return;
  self.skipWaiting();
  self.clients.claim();
  const clients = await self.clients.matchAll();

  const result = {
    ${propsToGet.map((x) => `'${x}': navigator.${x}`).join(',\n')}
  };
  const data = JSON.stringify(result);

  clients.forEach(client => client.postMessage(data));
});`;
    });

    const xhr = new Promise<object>((resolve) => {
      koaServer.post('/service-xhr', async (ctx) => {
        requestUserAgentStrings.push(ctx.get('user-agent'));
        const body = JSON.parse((await Helpers.readableToBuffer(ctx.req)).toString());
        resolve(body);
        ctx.body = 'Ok';
      });
    });

    /////// TEST BEGIN /////

    const page = await agent.newPage();
    await page.goto(`${koaServer.baseUrl}/sw-test`);
    const params = await xhr;

    for (const useragent of requestUserAgentStrings) {
      expect(useragent).toBe(agentMeta.string);
    }

    for (const prop of propsToGet) {
      const windowValue = await page.evaluate(`navigator.${prop}`);
      expect(params[prop]).toStrictEqual(windowValue);
    }
  });

  it('should be able to load the creep-js phantom worker tests', async () => {
    let jsonResult = new Resolvable<string>();
    const httpsServer = await Helpers.runHttpsServer(async (req, res) => {
      res.setHeader('access-control-allow-origin', '*');
      if (req.url.match('/creepjs/tests/workers.html')) {
        res.end(`<!DOCTYPE html>
      <html lang="en">
      <body>
      <div id="fingerprint-data"></div>
          <script src="workers.js"></script>
      </body>
      </html>`);
      } else if (req.url.includes('worker-result')) {
        const result = await Helpers.readableToBuffer(req);
        jsonResult.resolve(result.toString());
        res.end('');
      } else {
        await new Promise((resolve) => setTimeout(resolve, 50));
        const body = Fs.readFileSync(`${__dirname}/assets/worker.js`);
        res.setHeader('etag', 'W/"602f25aa-573c"');
        res.setHeader('content-type', 'application/javascript; charset=utf-8');
        res.end(body);
      }
    });

    jsonResult = new Resolvable<string>();

    const agent = pool.createAgent({ logger });
    Helpers.needsClosing.push(agent);
    const page = await agent.newPage();
    await page.goto(`${httpsServer.baseUrl}/creepjs/tests/workers.html`);

    const result = JSON.parse(await jsonResult.promise);
    expect(result).toBeTruthy();

    const { windowScope, dedicatedWorker, sharedWorker, serviceWorker } = result;
    expect(windowScope.userAgent).toBe(dedicatedWorker.userAgent);
    expect(windowScope.userAgent).toBe(serviceWorker.userAgent);
    expect(windowScope.userAgent).toBe(sharedWorker.userAgent);
    expect(windowScope.memory).toBe(dedicatedWorker.memory);
    expect(windowScope.memory).toBe(serviceWorker.memory);
    expect(windowScope.memory).toBe(sharedWorker.memory);
    await agent.close();
  });
});
