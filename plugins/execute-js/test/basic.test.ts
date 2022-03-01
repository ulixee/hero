import Hero, { LocationStatus, Core } from '@ulixee/hero-fullstack';
import { Helpers } from '@ulixee/hero-testing';
import { ITestKoaServer } from '@ulixee/hero-testing/helpers';
import ExecuteJsPlugin from '@ulixee/execute-js-plugin';
import ExecuteJsCorePlugin from '../lib/CorePlugin';

let koaServer: ITestKoaServer;
beforeAll(async () => {
  Core.use(ExecuteJsCorePlugin);
  Core.allowDynamicPluginLoading = false;
  koaServer = await Helpers.runKoaServer();
  Helpers.onClose(() => {
    koaServer.close();
  }, true);
});

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

test('it should run function in browser and return response', async () => {
  koaServer.get('/test1', ctx => {
    ctx.body = `<body>
<script>
    window.testRun = function() {
      return 'ItWorks';
    }
</script>
</body>`;
  });

  const hero = new Hero();
  Helpers.onClose(() => hero.close());
  hero.use(ExecuteJsPlugin);

  await hero.goto(`${koaServer.baseUrl}/test1`);
  await hero.activeTab.waitForLoad(LocationStatus.DomContentLoaded);
  const response = await hero.executeJs(() => {
    // @ts-ignore
    return window.testRun();
  });
  expect(response).toEqual('ItWorks');
  await hero.close();
});

test('it should run function in browser and return incr', async () => {
  koaServer.get('/test2', ctx => {
    ctx.body = `<body>
<script>
    window.testRun = function(num) {
      return num + 1;
    }
</script>
</body>`;
  });

  const hero = new Hero();
  Helpers.onClose(() => hero.close());
  hero.use(ExecuteJsPlugin);

  await hero.goto(`${koaServer.baseUrl}/test2`);
  await hero.activeTab.waitForLoad(LocationStatus.DomContentLoaded);
  const response = await hero.executeJs(num => {
    // @ts-ignore
    return window.testRun(num);
  }, 1);
  expect(response).toEqual(2);
  await hero.close();
});

test('it should run function in iframe', async () => {
  koaServer.get('/iframe-host', ctx => {
    ctx.body = `<body>
<h1>Iframe page</h1>
<iframe src="/iframe" id="iframe"></iframe>
<script>
    window.testFunc = function() {
      return "page";
    }
</script>
</body>`;
  });
  koaServer.get('/iframe', ctx => {
    ctx.body = `<body>
<script>
    window.testFunc = function() {
      return "iframe";
    }
</script>
</body>`;
  });

  const hero = new Hero();
  Helpers.onClose(() => hero.close());
  hero.use(ExecuteJsPlugin);

  await hero.goto(`${koaServer.baseUrl}/iframe-host`);
  await hero.waitForPaintingStable();

  const iframe = await hero.getFrameEnvironment(hero.document.querySelector('iframe'));
  await iframe.waitForLoad(LocationStatus.DomContentLoaded);

  await expect(
    iframe.executeJs(() => {
      // @ts-ignore
      return window.testFunc();
    }),
  ).resolves.toBe('iframe');
  await expect(
    hero.activeTab.executeJs(() => {
      // @ts-ignore
      return window.testFunc();
    }),
  ).resolves.toBe('page');
  await expect(
    hero.executeJs(() => {
      // @ts-ignore
      return window.testFunc();
    }),
  ).resolves.toBe('page');
  await hero.close();
});
