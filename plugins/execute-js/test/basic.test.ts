import { Agent, LocationStatus } from 'secret-agent';
import { Helpers } from '@secret-agent/testing';
import { ITestKoaServer } from '@secret-agent/testing/helpers';
import ExecuteJsPlugin from '@secret-agent/execute-js-plugin';
import Core from '@secret-agent/core';
import ConnectionToClient from '@secret-agent/core/server/ConnectionToClient';
import CoreServer from '@secret-agent/core/server';
import ExecuteJsCorePlugin from '../lib/CoreExtender';

let koaServer: ITestKoaServer;
let connectionToClient: ConnectionToClient;
let coreServer;
beforeAll(async () => {
  coreServer = new CoreServer();
  await coreServer.listen({ port: 0 });
  Core.use(ExecuteJsCorePlugin);
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

test('it should match older userAgent strings', async () => {
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
  const agent = new Agent({
    userAgent,
    connectionToCore: {
      host: await coreServer.address,
    },
  });
  Helpers.onClose(() => agent.close(), true);
  agent.use(ExecuteJsPlugin);

  await agent.goto(`${koaServer.baseUrl}/test1`);
  await agent.activeTab.waitForLoad(LocationStatus.DomContentLoaded);
  const response = await agent.executeJs(() => {
    // eslint-disable-line prefer-arrow-callback
    // @ts-ignore
    return window.testRun();
  });
  expect(response).toEqual('ItWorks');
  agent.close();
});
