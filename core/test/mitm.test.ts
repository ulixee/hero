import GlobalPool from "@secret-agent/core/lib/GlobalPool";
import { UpstreamProxy } from "@secret-agent/mitm";
import { Helpers } from "@secret-agent/testing";
import Chrome83 from "@secret-agent/emulate-chrome-83";
import MitmRequestContext from "@secret-agent/mitm/lib/MitmRequestContext";
import { createPromise } from "@secret-agent/commons/utils";
import { LocationStatus } from "@secret-agent/core-interfaces/Location";
import Core from "../index";

const mocks = {
  MitmRequestContext: {
    create: jest.spyOn(MitmRequestContext, 'create'),
  },
};

beforeAll(async () => {
  await GlobalPool.start([Chrome83.emulatorId]);
});

beforeEach(() => {
  mocks.MitmRequestContext.create.mockClear();
});

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

test('should be able to run multiple pages each with their own proxy', async () => {
  const acquireUpstreamProxyUrl = jest.spyOn<any, any>(UpstreamProxy.prototype, 'acquireProxyUrl');

  const httpServer = await Helpers.runHttpServer();

  const url1 = `${httpServer.url}page1`;
  const browserSession1 = await GlobalPool.createSession({});
  Helpers.needsClosing.push(browserSession1);
  const tab1 = await browserSession1.createTab();
  await tab1.goto(url1);
  await tab1.waitForMillis(100);
  expect(acquireUpstreamProxyUrl).toHaveBeenLastCalledWith(url1);

  const url2 = `${httpServer.url}page2`;
  const browserSession2 = await GlobalPool.createSession({});
  Helpers.needsClosing.push(browserSession2);
  const tab2 = await browserSession2.createTab();
  await tab2.goto(url2);
  await tab2.waitForMillis(100);
  expect(acquireUpstreamProxyUrl).toHaveBeenLastCalledWith(url2);
});

test('should send preflight requests', async () => {
  const koa = await Helpers.runKoaServer(false);

  const corsPromise = new Promise<boolean>(resolve => {
    koa.options('/post', ctx => {
      ctx.response.set('Access-Control-Allow-Origin', ctx.headers.origin);
      ctx.response.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
      ctx.response.set('Access-Control-Allow-Headers', 'X-PINGOTHER, Content-Type');
      ctx.body = '';
      resolve(true);
    });
  });
  const postPromise = new Promise<boolean>(resolve => {
    koa.post('/post', ctx => {
      ctx.body = 'ok';
      resolve(true);
    });
  });

  const session = await GlobalPool.createSession({});
  Helpers.needsClosing.push(session);
  session.mitmRequestSession.blockedResources.urls = [
    'http://dataliberationfoundation.org/postback',
  ];
  session.mitmRequestSession.blockedResources.handlerFn = (request, response) => {
    response.end(`<html lang="en">
<body>
<script type="text/javascript">
const xhr = new XMLHttpRequest();
xhr.open('POST', '${koa.baseUrl}/post');
xhr.setRequestHeader('X-PINGOTHER', 'pingpong');
xhr.setRequestHeader('Content-Type', 'application/xml');
xhr.send('<person><name>DLF</name></person>'); 
</script>
</body>
</html>
    `);
    return true;
  };
  const tab = await session.createTab();
  await tab.goto(`http://dataliberationfoundation.org/postback`);
  await expect(corsPromise).resolves.toBeTruthy();
  await expect(postPromise).resolves.toBeTruthy();

  expect(mocks.MitmRequestContext.create).toHaveBeenCalledTimes(3);

  const context = mocks.MitmRequestContext.create.mock.results[1];
  expect(context.value.method).toBe('OPTIONS');

  const context2 = mocks.MitmRequestContext.create.mock.results[2];
  expect(context2.value.method).toBe('POST');
});

test('should proxy requests from worker threads', async () => {
  const koa = await Helpers.runKoaServer(false);
  koa.get('/worker.js', ctx => {
    ctx.set('content-type', 'application/javascript');
    ctx.body = `
onmessage = function(e) {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', '${koa.baseUrl}/xhr');
  xhr.send('FromWorker'); 
}`;
  });
  koa.get('/test', ctx => {
    ctx.body = `<html lang="en">
<script>
const myWorker = new Worker("worker.js");
myWorker.postMessage('send');
</script>
</html>
    `;
  });
  const serviceXhr = new Promise<string>(resolve => {
    koa.post('/xhr', async ctx => {
      ctx.body = 'Ok';
      const requestBody = await Helpers.readableToBuffer(ctx.req);
      resolve(requestBody.toString());
    });
  });
  const session = await GlobalPool.createSession({});
  Helpers.needsClosing.push(session);
  const tab = await session.createTab();
  await tab.goto(`${koa.baseUrl}/test`);
  await tab.waitForLoad('AllContentLoaded');
  await expect(serviceXhr).resolves.toBe('FromWorker');
  expect(mocks.MitmRequestContext.create).toHaveBeenCalledTimes(3);
});

test('should not see proxy headers in a service worker', async () => {
  const xhrHeaders = createPromise();
  const xhrHeadersFromWorker = createPromise();
  const server = await Helpers.runHttpsServer(async (request, response) => {
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
    for await (const chunk of request) body += chunk;
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

  process.env.MITM_ALLOW_INSECURE = 'true';
  const session = await GlobalPool.createSession({});
  Helpers.needsClosing.push(session);
  const tab = await session.createTab();
  await tab.goto(`${server.baseUrl}/service-worker`);
  await tab.waitForLoad('AllContentLoaded');
  const [originalHeaders, headersFromWorker] = await Promise.all([
    xhrHeaders.promise,
    xhrHeadersFromWorker.promise,
  ]);
  // check that both go through mitm
  await expect(originalHeaders['proxy-authorization']).not.toBeTruthy();
  await expect(headersFromWorker['proxy-authorization']).not.toBeTruthy();
  await expect(originalHeaders['user-agent']).toBe(headersFromWorker['user-agent']);
  expect(mocks.MitmRequestContext.create).toHaveBeenCalledTimes(4);
});

test('should proxy iframe requests', async () => {
  const koaServer = await Helpers.runKoaServer(false);
  const meta = await Core.createTab();
  const core = Core.byTabId[meta.tabId];

  // @ts-ignore
  const session = core.session;

  session.mitmRequestSession.blockedResources.urls = [
    'https://dataliberationfoundation.org/iframe',
    'https://dataliberationfoundation.org/test.css',
    'https://dataliberationfoundation.org/dlfSite.png',
  ];
  session.mitmRequestSession.blockedResources.handlerFn = (request, response) => {
    response.end(`<html lang="en">
<head title="test"><link rel="stylesheet" type="text/css" href="/test.css"/></head>
<body><img alt="none" src="/dlfSite.png"/></body>
</html>`);
    return true;
  };
  koaServer.get('/iframe-test', async ctx => {
    ctx.body = `<html lang="en">
<body>
This is the main body
<iframe src="https://dataliberationfoundation.org/iframe"></iframe>
</body>
</html>`;
  });
  await core.goto(`${koaServer.baseUrl}/iframe-test`);
  await core.waitForLoad(LocationStatus.AllContentLoaded);
  expect(mocks.MitmRequestContext.create).toHaveBeenCalledTimes(4);
  const urls = mocks.MitmRequestContext.create.mock.results.map(x => x.value.url.href);
  expect(urls).toEqual([
    expect.stringMatching(/http:\/\/localhost:\d+\/iframe-test/),
    'https://dataliberationfoundation.org/iframe',
    'https://dataliberationfoundation.org/test.css',
    'https://dataliberationfoundation.org/dlfSite.png',
  ]);
});
