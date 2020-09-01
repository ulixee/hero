import GlobalPool from '@secret-agent/core/lib/GlobalPool';
import { UpstreamProxy } from '@secret-agent/mitm';
import { Helpers } from '@secret-agent/testing';
import Chrome83 from '@secret-agent/emulate-chrome-83';
import MitmRequestContext from '@secret-agent/mitm/lib/MitmRequestContext';
import Tab from '../lib/Tab';

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
  const tab1 = await Tab.create(browserSession1);
  await tab1.goto(url1);
  await tab1.waitForMillis(100);
  expect(acquireUpstreamProxyUrl).toHaveBeenLastCalledWith(url1);

  const url2 = `${httpServer.url}page2`;
  const browserSession2 = await GlobalPool.createSession({});
  Helpers.needsClosing.push(browserSession2);
  const tab2 = await Tab.create(browserSession2);
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
  session.requestMitmProxySession.blockUrls = ['http://dataliberationfoundation.org/postback'];
  session.requestMitmProxySession.blockResponseHandlerFn = (request, response) => {
    response.end(`<html>
<head></head>
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
  const tab = await Tab.create(session);
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
  const koa = await Helpers.runKoaServer();
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
    ctx.body = `<html><head></head>
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
  const tab = await Tab.create(session);
  await tab.goto(`${koa.baseUrl}/test`);
  await tab.waitForLoad('AllContentLoaded');
  await expect(serviceXhr).resolves.toBe('FromWorker');
});
