import Hero, { Core, LocationStatus } from '@ulixee/hero-fullstack';
import { Helpers } from '@ulixee/testing';
import { ITestKoaServer } from '@ulixee/testing/helpers';
import ExecuteJsPlugin from '@ulixee/execute-js-plugin';

let koaServer: ITestKoaServer;
beforeAll(async () => {
  koaServer = await Helpers.runKoaServer();
  Helpers.onClose(() => {
    koaServer.close();
  }, true);
});

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

test('it should work even if dependency not registered through Core.use', async () => {
  koaServer.get('/test2', ctx => {
    ctx.body = `<body>
<script>
    window.testRun = function() {
      return 'ItWorks';
    }
</script>
</body>`;
  });

  const userAgent =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.165 Safari/537.36';
  const hero = new Hero({ userAgent });
  Helpers.onClose(() => hero.close(), true);
  hero.use(ExecuteJsPlugin);

  await hero.goto(`${koaServer.baseUrl}/test2`);
  await hero.activeTab.waitForLoad(LocationStatus.DomContentLoaded);
  // @ts-ignore
  const response = await hero.executeJs(() => {
    // @ts-ignore
    return window.testRun();
  });
  expect(response).toEqual('ItWorks');
  await hero.close();
});

test('it should fail if dependency not registered and allowDynamicPluginLoading = false', async () => {
  koaServer.get('/test2', ctx => {
    ctx.body = `<body>
<script>
    window.testRun = function() {
      return 'ItWorks';
    }
</script>
</body>`;
  });

  Core.allowDynamicPluginLoading = false;
  const userAgent =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.165 Safari/537.36';
  const hero = new Hero({ userAgent });
  Helpers.onClose(() => hero.close(), true);
  hero.use(ExecuteJsPlugin);

  await hero.goto(`${koaServer.baseUrl}/test2`);
  await hero.activeTab.waitForLoad(LocationStatus.DomContentLoaded);
  // @ts-ignore
  const response = await hero.executeJs(() => {
    // @ts-ignore
    return window.testRun();
  });
  expect(response).toEqual(undefined);
  await hero.close();
});
