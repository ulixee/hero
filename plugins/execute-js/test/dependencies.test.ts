import { LocationStatus } from '@ulixee/hero';
import { Helpers, Hero } from '@ulixee/hero-testing';
import Core from '@ulixee/hero-core';
import { ITestKoaServer } from '@ulixee/hero-testing/helpers';
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

  const hero = new Hero();
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
  const hero = new Hero();
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
