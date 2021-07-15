import { Hero, LocationStatus } from '@ulixee/hero';
import { Helpers } from '@ulixee/testing';
import { ITestKoaServer } from '@ulixee/testing/helpers';
import ExecuteJsPlugin from '@ulixee/execute-js-plugin';
import Core from '@ulixee/hero-core';
import ConnectionToClient from '@ulixee/hero-core/server/ConnectionToClient';
import CoreServer from '@ulixee/hero-core/server';
import ExecuteJsCorePlugin from '../lib/CorePlugin';

let koaServer: ITestKoaServer;
let connectionToClient: ConnectionToClient;
let coreServer;
beforeAll(async () => {
  coreServer = new CoreServer();
  await coreServer.listen({ port: 0 });
  Core.use(ExecuteJsCorePlugin);
  Core.allowDynamicPluginLoading = false;
  koaServer = await Helpers.runKoaServer();
  connectionToClient = Core.addConnection();
  Helpers.onClose(() => {
    connectionToClient.disconnect();
    koaServer.close();
    coreServer.close();
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

  const userAgent =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.165 Safari/537.36';
  const hero = new Hero({
    userAgent,
    connectionToCore: {
      host: await coreServer.address,
    },
  });
  Helpers.onClose(() => hero.close(), true);
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

  const userAgent =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.165 Safari/537.36';
  const hero = new Hero({
    userAgent,
    connectionToCore: {
      host: await coreServer.address,
    },
  });
  Helpers.onClose(() => hero.close(), true);
  hero.use(ExecuteJsPlugin);

  await hero.goto(`${koaServer.baseUrl}/test2`);
  await hero.activeTab.waitForLoad(LocationStatus.DomContentLoaded);
  const response = await hero.executeJs((num) => {
    // @ts-ignore
    return window.testRun(num);
  }, 1);
  expect(response).toEqual(2);
  await hero.close();
});
