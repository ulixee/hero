import { Helpers } from '@secret-agent/testing';
import ChromeLatest from '@secret-agent/emulate-chrome-latest';
import MitmRequestContext from '@secret-agent/mitm/lib/MitmRequestContext';
import { createPromise } from '@secret-agent/commons/utils';
import { LocationStatus } from '@secret-agent/core-interfaces/Location';
import { ITestKoaServer } from '@secret-agent/testing/helpers';
import Resolvable from '@secret-agent/commons/Resolvable';
import GlobalPool from '../lib/GlobalPool';
import Core, { Session } from '../index';

const mocks = {
  MitmRequestContext: {
    create: jest.spyOn(MitmRequestContext, 'create'),
  },
};

let koa: ITestKoaServer;
beforeAll(async () => {
  koa = await Helpers.runKoaServer(true);
  await GlobalPool.start([ChromeLatest.id]);
});

beforeEach(async () => {
  mocks.MitmRequestContext.create.mockClear();
});

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

test('should send a Host header to secure http1 Chrome requests', async () => {
  let rawHeaders: string[] = [];

  const server = await Helpers.runHttpsServer((req, res) => {
    rawHeaders = req.rawHeaders;
    res.end('<html>Loaded</html>');
  });

  const url = `${server.baseUrl}/`;
  const session = await GlobalPool.createSession({
    browserEmulatorId: 'chrome-83',
  });
  Helpers.needsClosing.push(session);
  const tab = await session.createTab();
  process.env.MITM_ALLOW_INSECURE = 'true';
  await tab.goto(url);
  expect(rawHeaders[0]).toBe('Host');
  process.env.MITM_ALLOW_INSECURE = 'false';
});

test('should send preflight requests', async () => {
  const corsPromise = new Promise<boolean>(resolve => {
    koa.options('/preflightPost', ctx => {
      ctx.response.set('Access-Control-Allow-Origin', ctx.headers.origin);
      ctx.response.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
      ctx.response.set('Access-Control-Allow-Headers', 'X-PINGOTHER, Content-Type');
      ctx.body = '';
      resolve(true);
    });
  });
  const postPromise = new Promise<boolean>(resolve => {
    koa.post('/preflightPost', ctx => {
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
xhr.open('POST', '${koa.baseUrl}/preflightPost');
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
  await tab.goto(`${koa.baseUrl}/testWorker`);
  await tab.waitForLoad('PaintingStable');
  await expect(serviceXhr).resolves.toBe('FromWorker');
  expect(mocks.MitmRequestContext.create).toHaveBeenCalledTimes(3);
});

test('should proxy requests from shared workers', async () => {
  const xhrResolvable = new Resolvable<string>();
  const server = await Helpers.runHttpsServer(async (req, res) => {
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
    } else if (req.url === '/testSharedWorker') {
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
    } else if (req.url === '/sharedWorkerXhr') {
      res.setHeader('content-type', 'text');
      res.end('ok');
      const requestBody = await Helpers.readableToBuffer(req);
      xhrResolvable.resolve(requestBody.toString());
    }
  });
  const session = await GlobalPool.createSession({});
  Helpers.needsClosing.push(session);
  const tab = await session.createTab();
  await tab.goto(`${server.baseUrl}/testSharedWorker`);
  await tab.waitForLoad('PaintingStable');
  await expect(xhrResolvable.promise).resolves.toBe('FromSharedWorker');
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
  await tab.waitForLoad('PaintingStable');
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
  const connection = Core.addConnection();
  Helpers.onClose(() => connection.disconnect());

  const meta = await connection.createSession();
  const tab = Session.getTab(meta);

  const session = tab.session;

  session.mitmRequestSession.blockedResources.urls = [
    'https://dataliberationfoundation.org/iframe',
    'https://dataliberationfoundation.org/test.css',
    'https://dataliberationfoundation.org/dlfSite.png',
  ];
  session.mitmRequestSession.blockedResources.handlerFn = (request, response) => {
    response.end(`<html lang="en">
<head><link rel="stylesheet" type="text/css" href="/test.css"/></head>
<body><img alt="none" src="/dlfSite.png"/></body>
</html>`);
    return true;
  };
  koa.get('/iframe-test', async ctx => {
    ctx.body = `<html lang="en">
<body>
This is the main body
<iframe src="https://dataliberationfoundation.org/iframe"></iframe>
</body>
</html>`;
  });
  await tab.goto(`${koa.baseUrl}/iframe-test`);
  await tab.waitForLoad(LocationStatus.PaintingStable);
  expect(mocks.MitmRequestContext.create).toHaveBeenCalledTimes(4);
  const urls = mocks.MitmRequestContext.create.mock.results.map(x => x.value.url.href);
  expect(urls).toEqual([
    expect.stringMatching(/http:\/\/localhost:\d+\/iframe-test/),
    'https://dataliberationfoundation.org/iframe',
    'https://dataliberationfoundation.org/test.css',
    'https://dataliberationfoundation.org/dlfSite.png',
  ]);
});
