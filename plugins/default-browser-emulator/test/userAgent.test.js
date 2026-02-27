"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const Pool_1 = require("@ulixee/unblocked-agent/lib/Pool");
const unblocked_agent_testing_1 = require("@ulixee/unblocked-agent-testing");
const index_1 = require("../index");
let koaServer;
let pool;
const logger = unblocked_agent_testing_1.TestLogger.forTest(module);
const chromeVersion = index_1.defaultBrowserEngine.version.major;
beforeEach(unblocked_agent_testing_1.Helpers.beforeEach);
beforeAll(async () => {
    pool = new Pool_1.default({ plugins: [index_1.default] });
    unblocked_agent_testing_1.Helpers.onClose(() => pool.close(), true);
    await pool.start();
    koaServer = await unblocked_agent_testing_1.Helpers.runKoaServer();
});
afterAll(unblocked_agent_testing_1.Helpers.afterAll);
afterEach(unblocked_agent_testing_1.Helpers.afterEach);
describe('user agent and platform', () => {
    const propsToGet = [
        `appVersion`,
        `platform`,
        `userAgent`,
        `deviceMemory`,
        `userAgentData.mobile`,
        `userAgentData.platform`,
        `userAgentData.brands`,
        'connection.rtt',
    ];
    it('should be able to configure a userAgent', async () => {
        const userAgentSelector = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion}.0.4389.114 Safari/537.36`;
        const agent = pool.createAgent({
            logger,
            customEmulatorConfig: { userAgentSelector },
        });
        unblocked_agent_testing_1.Helpers.needsClosing.push(agent);
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
        unblocked_agent_testing_1.Helpers.needsClosing.push(agent);
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
        unblocked_agent_testing_1.Helpers.needsClosing.push(agent);
        const agentMeta = await agent.emulationProfile.userAgentOption;
        const chromeMatch = agentMeta.string.match(/Chrome\/(\d+)/);
        expect(chromeMatch).toBeTruthy();
        const version = Number(chromeMatch[1]);
        expect(version).toBe(Number(chromeVersion));
    });
    it('should add user agent and platform to window & frames', async () => {
        const agent = pool.createAgent({ logger });
        unblocked_agent_testing_1.Helpers.needsClosing.push(agent);
        const agentMeta = await agent.emulationProfile.userAgentOption;
        const requestUserAgentStrings = [];
        koaServer.get('/agent-test', ctx => {
            requestUserAgentStrings.push(ctx.get('user-agent'));
            ctx.body = `<html lang="en">
<h1>Agent Test</h1>
<iframe src="/frame"></iframe>
</html>`;
        });
        koaServer.get('/frame', ctx => {
            requestUserAgentStrings.push(ctx.get('user-agent'));
            ctx.body = `<html><body>
<script>
  const data = {
    ${propsToGet.map(x => `'${x}': navigator.${x}`).join(',\n')}
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
        const frameXhr = new Promise(resolve => {
            koaServer.post('/frame-xhr', async (ctx) => {
                requestUserAgentStrings.push(ctx.get('user-agent'));
                const body = JSON.parse((await unblocked_agent_testing_1.Helpers.readableToBuffer(ctx.req)).toString());
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
        const windowParams = {};
        for (const prop of propsToGet) {
            windowParams[prop] = await page.evaluate(`navigator.${prop}`);
        }
        expect(agentMeta.string).toBe(windowParams.userAgent);
        expect(agent.emulationProfile.windowNavigatorPlatform).toBe(windowParams.platform);
        for (const prop of propsToGet) {
            expect(`${prop}=${frameParams[prop]}`).toStrictEqual(`${prop}=${windowParams[prop]}`);
        }
        const extras = await page.evaluate(`navigator.userAgentData.getHighEntropyValues(['platformVersion', 'architecture', 'bitness', 'model', 'uaFullVersion'])`);
        for (const [prop, value] of Object.entries(extras)) {
            expect(`${prop}=${frameParams[prop]}`).toStrictEqual(`${prop}=${value}`);
        }
    });
    it('should maintain user agent and platform across navigations', async () => {
        const agent = pool.createAgent({ logger });
        unblocked_agent_testing_1.Helpers.needsClosing.push(agent);
        const agentMeta = await agent.emulationProfile.userAgentOption;
        const requestUserAgentStrings = [];
        const httpsServer = await unblocked_agent_testing_1.Helpers.runHttpsServer(async (req, res) => {
            requestUserAgentStrings.push(req.headers['user-agent']);
            if (req.url === '/s2-page1') {
                res.end(`<html lang="en">
<script>
  var startPageVars = {
    ${propsToGet.map(x => `'${x}': navigator.${x}`).join(',\n')}
  };
</script>
<body><a href="${koaServer.baseUrl}/page2">link</a></body></html>`);
            }
            else {
                res.writeHead(404).end();
            }
        });
        koaServer.get('/page1', ctx => {
            requestUserAgentStrings.push(ctx.get('user-agent'));
            ctx.body = `<html lang="en"><body><a href="${httpsServer.baseUrl}/s2-page1">link</a></body></html>`;
        });
        koaServer.get('/page2', ctx => {
            requestUserAgentStrings.push(ctx.get('user-agent'));
            ctx.body = `<html lang="en"><body><h1>Last Page</h1></body></html>`;
        });
        const page = await agent.newPage();
        async function getParams() {
            const windowParams = {};
            for (const prop of propsToGet) {
                windowParams[prop] = await page.evaluate(`navigator.${prop}`);
            }
            return windowParams;
        }
        await page.goto(`${koaServer.baseUrl}/page1`);
        const page1WindowParams = await getParams();
        expect(agentMeta.string).toBe(page1WindowParams.userAgent);
        expect(agent.emulationProfile.windowNavigatorPlatform).toBe(page1WindowParams.platform);
        await page.click('a');
        const page2WindowParams = await getParams();
        for (const prop of propsToGet) {
            expect(`${prop}=${page2WindowParams[prop]}`).toStrictEqual(`${prop}=${page1WindowParams[prop]}`);
        }
        const page2StartParams = await page.evaluate('startPageVars');
        for (const prop of propsToGet) {
            expect(`${prop}=${page2StartParams[prop]}`).toStrictEqual(`${prop}=${page1WindowParams[prop]}`);
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
        unblocked_agent_testing_1.Helpers.needsClosing.push(agent);
        const agentMeta = await agent.emulationProfile.userAgentOption;
        const requestUserAgentStrings = [];
        koaServer.get('/workers-test', ctx => {
            requestUserAgentStrings.push(ctx.get('user-agent'));
            ctx.body = `<html lang="en">
<script>
new Worker("worker.js").postMessage('');

const blob = new Blob([${`onmessage = () => {
  const data = {
    ${propsToGet.map(x => `'${x}': navigator.${x}`).join(',\n')}
  };
  fetch('http://${koaServer.baseHost}/worker-blob-xhr', {
   method: 'POST',
   body: JSON.stringify(data)
  });
}`
                .split('\n')
                .map(x => `"${x}"`)
                .join('\n,')}], { type: 'application/javascript' });
const blobUrl = URL.createObjectURL(blob);
new Worker(blobUrl).postMessage('');
</script>
</html>`;
        });
        koaServer.get('/worker.js', ctx => {
            requestUserAgentStrings.push(ctx.get('user-agent'));
            ctx.set('content-type', 'application/javascript');
            ctx.body = `onmessage = () => {
  const data = {
    ${propsToGet.map(x => `'${x}': navigator.${x}`).join(',\n')}
  };
  fetch('/worker-xhr', {
   method: 'POST',
   body: JSON.stringify(data)
  });
}`;
        });
        const xhr = new Promise(resolve => {
            koaServer.post('/worker-xhr', async (ctx) => {
                requestUserAgentStrings.push(ctx.get('user-agent'));
                const body = JSON.parse((await unblocked_agent_testing_1.Helpers.readableToBuffer(ctx.req)).toString());
                resolve(body);
                ctx.body = 'Ok';
            });
        });
        const blobXhr = new Promise(resolve => {
            koaServer.post('/worker-blob-xhr', async (ctx) => {
                requestUserAgentStrings.push(ctx.get('user-agent'));
                const body = JSON.parse((await unblocked_agent_testing_1.Helpers.readableToBuffer(ctx.req)).toString());
                resolve(body);
                ctx.body = 'Ok';
            });
        });
        const page = await agent.newPage();
        await page.goto(`${koaServer.baseUrl}/workers-test`);
        const params = await xhr;
        const blobParams = await blobXhr;
        for (const useragent of requestUserAgentStrings) {
            expect(useragent).toBe(agentMeta.string);
        }
        for (const prop of propsToGet) {
            const windowValue = await page.evaluate(`navigator.${prop}`);
            expect(params[prop]).toStrictEqual(windowValue);
            expect(blobParams[prop]).toStrictEqual(windowValue);
            expect(`${prop}=${params[prop]}`).toStrictEqual(`${prop}=${windowValue}`);
            expect(`${prop}=${blobParams[prop]}`).toStrictEqual(`${prop}=${windowValue}`);
        }
    });
    it('should add user agent and platform to service workers', async () => {
        const agent = pool.createAgent({ logger });
        unblocked_agent_testing_1.Helpers.needsClosing.push(agent);
        const agentMeta = await agent.emulationProfile.userAgentOption;
        const requestUserAgentStrings = [];
        koaServer.get('/sw-test', ctx => {
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
        koaServer.get('/service-worker.js', ctx => {
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
    ${propsToGet.map(x => `'${x}': navigator.${x}`).join(',\n')}
  };
  const data = JSON.stringify(result);

  clients.forEach(client => client.postMessage(data));
});`;
        });
        const xhr = new Promise(resolve => {
            koaServer.post('/service-xhr', async (ctx) => {
                requestUserAgentStrings.push(ctx.get('user-agent'));
                const body = JSON.parse((await unblocked_agent_testing_1.Helpers.readableToBuffer(ctx.req)).toString());
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
        let jsonResult = new Resolvable_1.default();
        const httpsServer = await unblocked_agent_testing_1.Helpers.runHttpsServer(async (req, res) => {
            res.setHeader('access-control-allow-origin', '*');
            if (req.url.match('/creepjs/tests/workers.html')) {
                res.end(`<!DOCTYPE html>
      <html lang="en">
      <body>
      <div id="fingerprint-data"></div>
          <script src="workers.js"></script>
      </body>
      </html>`);
            }
            else if (req.url.includes('worker-result')) {
                const result = await unblocked_agent_testing_1.Helpers.readableToBuffer(req);
                jsonResult.resolve(result.toString());
                res.end('');
            }
            else {
                await new Promise(resolve => setTimeout(resolve, 50));
                const body = Fs.readFileSync(`${__dirname}/assets/worker.js`);
                res.setHeader('etag', 'W/"602f25aa-573c"');
                res.setHeader('content-type', 'application/javascript; charset=utf-8');
                res.end(body);
            }
        });
        jsonResult = new Resolvable_1.default();
        const agent = pool.createAgent({ logger });
        unblocked_agent_testing_1.Helpers.needsClosing.push(agent);
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
//# sourceMappingURL=userAgent.test.js.map