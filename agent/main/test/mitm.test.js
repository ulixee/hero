"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const unblocked_agent_testing_1 = require("@ulixee/unblocked-agent-testing");
const MitmRequestContext_1 = require("@ulixee/unblocked-agent-mitm/lib/MitmRequestContext");
const utils_1 = require("@ulixee/commons/lib/utils");
const Location_1 = require("@ulixee/unblocked-specification/agent/browser/Location");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const stream_1 = require("stream");
const index_1 = require("../index");
const _pageTestUtils_1 = require("./_pageTestUtils");
const mocks = {
    MitmRequestContext: {
        create: jest.spyOn(MitmRequestContext_1.default, 'create'),
    },
};
let koa;
let pool;
beforeAll(async () => {
    koa = await unblocked_agent_testing_1.Helpers.runKoaServer(true);
    pool = new index_1.Pool(unblocked_agent_testing_1.BrowserUtils.newPoolOptions);
    unblocked_agent_testing_1.Helpers.onClose(() => pool.close(), true);
    await pool.start();
});
beforeEach(async () => {
    mocks.MitmRequestContext.create.mockClear();
    unblocked_agent_testing_1.TestLogger.testNumber += 1;
});
afterAll(unblocked_agent_testing_1.Helpers.afterAll);
afterEach(unblocked_agent_testing_1.Helpers.afterEach);
function createCallResultsWithoutNonApplicableCalls() {
    // We dont care for the calls in other test results
    return mocks.MitmRequestContext.create.mock.results.filter(result => 
    // Favicon might or might not be called depending on OS, version and url
    !result.value.url.href.includes('favicon') &&
        // Not interesting in internal traffic here
        !result.value.url.href.includes('heroInternalUrl'));
}
test('should send a Host header to secure http1 Chrome requests', async () => {
    let rawHeaders = [];
    const server = await unblocked_agent_testing_1.Helpers.runHttpsServer((req, res) => {
        rawHeaders = req.rawHeaders;
        res.end('<html>Loaded</html>');
    });
    const url = `${server.baseUrl}/`;
    const agent = pool.createAgent({ logger: unblocked_agent_testing_1.TestLogger.forTest(module) });
    unblocked_agent_testing_1.Helpers.needsClosing.push(agent);
    const page = await agent.newPage();
    await page.goto(url);
    expect(rawHeaders[0]).toBe('Host');
});
test('should send preflight requests', async () => {
    const corsPromise = new Promise(resolve => {
        koa.options('/preflightPost', ctx => {
            ctx.response.set('Access-Control-Allow-Origin', ctx.headers.origin);
            ctx.response.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
            ctx.response.set('Access-Control-Allow-Headers', 'X-PINGOTHER, Content-Type');
            ctx.body = '';
            resolve(true);
        });
    });
    const postPromise = new Promise(resolve => {
        koa.post('/preflightPost', ctx => {
            ctx.body = 'ok';
            resolve(true);
        });
    });
    const agent = pool.createAgent({ logger: unblocked_agent_testing_1.TestLogger.forTest(module) });
    unblocked_agent_testing_1.Helpers.needsClosing.push(agent);
    agent.mitmRequestSession.interceptorHandlers.push({
        urls: ['https://ulixee.org/postback'],
        handlerFn(url, type, request, response) {
            response.end(`<html lang="en">
<body>
<script type="text/javascript">
const xhr = new XMLHttpRequest();
xhr.open('POST', '${koa.baseUrl}/preflightPost');
xhr.setRequestHeader('X-PINGOTHER', 'pingpong');
xhr.setRequestHeader('Content-Type', 'application/xml');
xhr.send('<person><name>DLF</name></person>');
</script>
</body>
</html>
    `);
            return true;
        },
    });
    const page = await agent.newPage();
    await page.goto(`https://ulixee.org/postback`);
    await expect(corsPromise).resolves.toBeTruthy();
    await expect(postPromise).resolves.toBeTruthy();
    const createCalls = createCallResultsWithoutNonApplicableCalls();
    expect(createCalls).toHaveLength(3);
    const context = createCalls[1];
    expect(context.value.method).toBe('OPTIONS');
    const context2 = createCalls[2];
    expect(context2.value.method).toBe('POST');
});
test('should proxy requests from worker threads', async () => {
    koa.get('/worker.js', ctx => {
        ctx.set('content-type', 'application/javascript');
        ctx.body = `
onmessage = function(e) {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', '${koa.baseUrl}/xhr');
  xhr.send('FromWorker');
}`;
    });
    koa.get('/testWorker', ctx => {
        ctx.body = `<html lang="en">
<h1>This is a visible page</h1>
<script>
const myWorker = new Worker("worker.js");
myWorker.postMessage('send');
</script>
</html>
    `;
    });
    const serviceXhr = new Promise(resolve => {
        koa.post('/xhr', async (ctx) => {
            ctx.body = 'Ok';
            const requestBody = await unblocked_agent_testing_1.Helpers.readableToBuffer(ctx.req);
            resolve(requestBody.toString());
        });
    });
    const agent = pool.createAgent({ logger: unblocked_agent_testing_1.TestLogger.forTest(module) });
    unblocked_agent_testing_1.Helpers.needsClosing.push(agent);
    const page = await agent.newPage();
    await page.goto(`${koa.baseUrl}/testWorker`);
    await page.mainFrame.waitForLoad({ loadStatus: 'PaintingStable' });
    await expect(serviceXhr).resolves.toBe('FromWorker');
    const createCalls = createCallResultsWithoutNonApplicableCalls();
    expect(createCalls).toHaveLength(3);
});
test('should proxy requests from shared workers', async () => {
    const xhrResolvable = new Resolvable_1.default();
    const server = await unblocked_agent_testing_1.Helpers.runHttpsServer(async (req, res) => {
        if (req.url === '/shared-worker.js') {
            res.setHeader('content-type', 'application/javascript');
            res.end(`
onconnect = async message => {
  const port = message.ports[0]
  const xhr = new XMLHttpRequest();
  xhr.open('POST', '${server.baseUrl}/sharedWorkerXhr');
  xhr.send('FromSharedWorker');
  port.postMessage('done')
}`);
        }
        else if (req.url === '/testSharedWorker') {
            res.setHeader('content-type', 'text/html');
            res.end(`<html lang="en">
<script>
try {

const sharedWorker = new SharedWorker('./shared-worker.js');
sharedWorker.port.start()
sharedWorker.port.addEventListener('message', message => {
    sharedWorker.port.close();
});
} catch(error ){
    console.log('couldnt start shared worker', error)
}
</script>
<h1>This is a visible page</h1>
</html>
    `);
        }
        else if (req.url === '/sharedWorkerXhr') {
            res.setHeader('content-type', 'text');
            res.end('ok');
            const requestBody = await unblocked_agent_testing_1.Helpers.readableToBuffer(req);
            xhrResolvable.resolve(requestBody.toString());
        }
    });
    const agent = pool.createAgent({ logger: unblocked_agent_testing_1.TestLogger.forTest(module) });
    unblocked_agent_testing_1.Helpers.needsClosing.push(agent);
    const page = await agent.newPage();
    await page.goto(`${server.baseUrl}/testSharedWorker`);
    await page.mainFrame.waitForLoad({ loadStatus: 'PaintingStable' });
    await expect(xhrResolvable.promise).resolves.toBe('FromSharedWorker');
    const createCalls = createCallResultsWithoutNonApplicableCalls();
    expect(createCalls).toHaveLength(3);
});
test('should not see proxy headers in a service worker', async () => {
    const xhrHeaders = (0, utils_1.createPromise)();
    const xhrHeadersFromWorker = (0, utils_1.createPromise)();
    const server = await unblocked_agent_testing_1.Helpers.runHttpsServer(async (request, response) => {
        const path = request.url;
        if (path === '/worker.js') {
            response.setHeader('content-type', 'application/javascript');
            response.end(`
self.addEventListener('fetch', event => {
  event.respondWith(async function(){
    return fetch(event.request.url, {
      method: event.request.method,
      credentials: 'include',
      headers: {
        'Intercepted': true,
        'original-proxy-auth': event.request.headers['proxy-authorization']
      },
      body: event.request.headers['proxy-authorization'] ? 'ProxyAuth' : 'LooksGoodFromPage'
    });
  }());
});

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', event => {
  if (event.data === 'activate-app') {
    self.skipWaiting();
    self.clients.claim();
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => client.postMessage("start-app"));
    });
    fetch('/xhr/2', {
      method: 'POST',
      body: 'FromWorker'
    }).catch(err => {});
  }
});
`);
        }
        if (path === '/service-worker') {
            response.setHeader('Server-Worker-Allowed', '/xhr');
            response.end(`<html lang="en"><body>
<h1>I'm loaded</h1>
<script>

window.addEventListener('load', function() {
    navigator.serviceWorker.register('./worker.js');
    navigator.serviceWorker.ready.then((reg) => {
      if (reg.active) {
        reg.active.postMessage("activate-app");
      }
    });
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data === 'start-app') {
        fetch('/xhr', {
          method: 'POST',
          body: 'FromPage'
        });
      }
   });
  });

</script>
</body>
</html>
    `);
        }
        let body = '';
        for await (const chunk of request)
            body += chunk;
        if (path === '/xhr') {
            xhrHeaders.resolve(request.headers);
            expect(body).toBe('LooksGoodFromPage');
            response.end('Cool');
        }
        if (path === '/xhr/2') {
            xhrHeadersFromWorker.resolve(request.headers);
            expect(body).toBe('FromWorker');
            response.end('Got it');
        }
    });
    const agent = pool.createAgent({ logger: unblocked_agent_testing_1.TestLogger.forTest(module) });
    unblocked_agent_testing_1.Helpers.needsClosing.push(agent);
    const page = await agent.newPage();
    await page.goto(`${server.baseUrl}/service-worker`);
    await page.mainFrame.waitForLoad({ loadStatus: 'PaintingStable' });
    const [originalHeaders, headersFromWorker] = await Promise.all([
        xhrHeaders.promise,
        xhrHeadersFromWorker.promise,
    ]);
    // check that both go through mitm
    await expect(originalHeaders['proxy-authorization']).not.toBeTruthy();
    await expect(headersFromWorker['proxy-authorization']).not.toBeTruthy();
    await expect(originalHeaders['user-agent']).toBe(headersFromWorker['user-agent']);
    const createCalls = createCallResultsWithoutNonApplicableCalls();
    expect(createCalls).toHaveLength(4);
});
test('should proxy iframe requests', async () => {
    const agent = pool.createAgent({ logger: unblocked_agent_testing_1.TestLogger.forTest(module) });
    const page = await agent.newPage();
    agent.mitmRequestSession.interceptorHandlers.push({
        urls: [
            'https://ulixee.org/iframe',
            'https://ulixee.org/test.css',
            'https://ulixee.org/dlfSite.png',
        ],
        handlerFn(url, type, request, response) {
            response.end(`<html lang="en">
<head><link rel="stylesheet" type="text/css" href="/test.css"/></head>
<body><img alt="none" src="/dlfSite.png"/></body>
</html>`);
            return true;
        },
    });
    koa.get('/iframe-test', async (ctx) => {
        ctx.body = `<html lang="en">
<body>
This is the main body
<iframe src="https://ulixee.org/iframe"></iframe>
</body>
</html>`;
    });
    await page.goto(`${koa.baseUrl}/iframe-test`);
    await page.waitForLoad(Location_1.LocationStatus.AllContentLoaded);
    const createCalls = createCallResultsWithoutNonApplicableCalls();
    expect(createCalls).toHaveLength(4);
    const urls = createCalls.map(x => x.value.url.href);
    expect(urls).toEqual([
        expect.stringMatching(/http:\/\/localhost:\d+\/iframe-test/),
        'https://ulixee.org/iframe',
        'https://ulixee.org/test.css',
        'https://ulixee.org/dlfSite.png',
    ]);
});
test('should be able to intercept http requests and responses', async () => {
    const agent = pool.createAgent({ logger: unblocked_agent_testing_1.TestLogger.forTest(module) });
    agent.hook({
        async beforeHttpRequest(request) {
            if (request.url.pathname === '/intercept-post') {
                // NOTE: need to delete the content length (or set to correct value)
                delete request.requestHeaders['Content-Length'];
            }
        },
        async beforeHttpRequestBody(request) {
            if (request.url.pathname === '/intercept-post') {
                // drain first
                for await (const _ of request.requestPostDataStream) {
                }
                // send body. NOTE: we had to change out the content length before the body step
                request.requestPostDataStream = stream_1.Readable.from(Buffer.from('Intercept request'));
            }
        },
        async beforeHttpResponse(response) {
            if (response.url.pathname === '/intercept-post') {
                response.responseHeaders['Content-Length'] = 'Intercepted'.length.toString();
            }
        },
        async beforeHttpResponseBody(response) {
            if (response.url.pathname === '/intercept-post') {
                for await (const _ of response.responseBodyStream) {
                }
                response.responseBodyStream = stream_1.Readable.from(Buffer.from('Intercepted'));
            }
        },
    });
    const page = await agent.newPage();
    const requestPost = new Resolvable_1.default();
    koa.post('/intercept-post', async (ctx) => {
        let request = '';
        for await (const chunk of ctx.req) {
            request += chunk.toString();
        }
        requestPost.resolve(request);
        ctx.body = 'Result';
    });
    koa.get('/intercept', async (ctx) => {
        ctx.body = `<html>
<body>
<h1>Nothing</h1>
</body>
<script type='text/javascript'>
 fetch('/intercept-post', {
    method: 'POST',
    body: 'Send',
  })
  .then(x => x.text())
  .then(x => {
    document.querySelector('h1').textContent = x;
    document.body.classList.add('ready');
  });
</script>
</html>`;
    });
    await page.goto(`${koa.baseUrl}/intercept`);
    await page.waitForLoad(Location_1.LocationStatus.AllContentLoaded);
    await expect(requestPost).resolves.toBe('Intercept request');
    await (0, _pageTestUtils_1.waitForVisible)(page.mainFrame, 'body.ready', 5e3);
    await expect(page.evaluate('document.querySelector("h1").textContent')).resolves.toBe('Intercepted');
});
//# sourceMappingURL=mitm.test.js.map