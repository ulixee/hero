import { Helpers } from '@ulixee/hero-testing/index';
import { ITestKoaServer } from '@ulixee/hero-testing/helpers';
import { LoadStatus } from '@ulixee/unblocked-specification/agent/browser/Location';
import ConnectionToHeroClient from '../connections/ConnectionToHeroClient';
import Core, { Session } from '../index';

let koaServer: ITestKoaServer;
let connectionToClient: ConnectionToHeroClient;
beforeAll(async () => {
  connectionToClient = Core.addConnection() as ConnectionToHeroClient;
  Helpers.onClose(() => connectionToClient.disconnect(), true);
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

it('can operate when unsafe eval not on', async () => {
  koaServer.get('/unsafe', ctx => {
    ctx.set('Content-Security-Policy', "script-src 'self'");
    ctx.body = `
        <body>
          <input type="text" />
        </body>
      `;
  });
  const inputUrl = `${koaServer.baseUrl}/unsafe`;
  const meta = await connectionToClient.createSession();
  const session = Session.get(meta.sessionId);
  const tab = session.getTab(meta.tabId);

  await tab.goto(inputUrl);
  await tab.waitForLoad(LoadStatus.DomContentLoaded)
  const input = await tab.execJsPath(['document', ['querySelector', 'input'], 'value']);
  expect(input.value).toBe('');
  const x = await tab.execJsPath(['document', ['querySelector', 'body'], 'scrollTop']);
  expect(x.value).toBe(0);
  await session.close();
});

it('should be able to get window variables', async () => {
  koaServer.get('/vars', ctx => {
    ctx.set('Content-Security-Policy', "default-src 'self'; script-src 'unsafe-inline'");
    ctx.body = `
        <body>
          <script type="text/javascript">
          const pageClicks = [1,2,3];
          function add(item){
            pageClicks.push(item)
          }
          </script>
        </body>
      `;
  });

  const meta = await connectionToClient.createSession();
  const session = Session.get(meta.sessionId);
  const tab = session.getTab(meta.tabId);
  await tab.goto(`${koaServer.baseUrl}/vars`);
  await tab.waitForLoad('DomContentLoaded');

  const pageClicks = await tab.getJsValue('pageClicks');
  expect(pageClicks).toStrictEqual([1, 2, 3]);

  await tab.getJsValue(`add('item4')`);
  const pageClicks2 = await tab.getJsValue('pageClicks');

  expect(pageClicks2).toStrictEqual([1, 2, 3, 'item4']);
  await session.close();
});
