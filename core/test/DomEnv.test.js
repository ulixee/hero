"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("@ulixee/hero-testing/index");
const Location_1 = require("@ulixee/unblocked-specification/agent/browser/Location");
const index_2 = require("../index");
let koaServer;
let connectionToClient;
let core;
beforeAll(async () => {
    core = await index_2.default.start();
    index_1.Helpers.onClose(core.close, true);
    connectionToClient = core.addConnection();
    index_1.Helpers.onClose(() => connectionToClient.disconnect(), true);
    koaServer = await index_1.Helpers.runKoaServer();
});
afterAll(index_1.Helpers.afterAll);
afterEach(index_1.Helpers.afterEach);
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
    const session = index_2.Session.get(meta.sessionId);
    const tab = session.getTab(meta.tabId);
    await tab.goto(inputUrl);
    await tab.waitForLoad(Location_1.LoadStatus.DomContentLoaded);
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
    const session = index_2.Session.get(meta.sessionId);
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
//# sourceMappingURL=DomEnv.test.js.map