import { Helpers } from '@secret-agent/testing/index';
import Core from '../index';

let koaServer;
beforeAll(async () => {
  await Core.prewarm();
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
  const meta = await Core.createTab();
  const core = Core.byTabId[meta.tabId];

  await core.goto(inputUrl);
  const input = await core.execJsPath(['document', ['querySelector', 'input'], 'value']);
  expect(input.value).toBe('');
  const x = await core.execJsPath([['document.querySelector', 'body'], 'scrollTop']);
  expect(x.value).toBe(0);
  await core.close();
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

  const meta = await Core.createTab();
  const core = Core.byTabId[meta.tabId];
  await core.goto(`${koaServer.baseUrl}/vars`);
  await core.waitForLoad('DomContentLoaded');

  const pageClicks = await core.getJsValue('pageClicks');
  expect(pageClicks.value).toStrictEqual([1, 2, 3]);

  await core.getJsValue(`add('item4')`);
  const pageClicks2 = await core.getJsValue('pageClicks');

  expect(pageClicks2.value).toStrictEqual([1, 2, 3, 'item4']);
  await core.close();
});
