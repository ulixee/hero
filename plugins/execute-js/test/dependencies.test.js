"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hero_1 = require("@ulixee/hero");
const hero_testing_1 = require("@ulixee/hero-testing");
const hero_core_1 = require("@ulixee/hero-core");
const execute_js_plugin_1 = require("@ulixee/execute-js-plugin");
let koaServer;
beforeAll(async () => {
    koaServer = await hero_testing_1.Helpers.runKoaServer();
    hero_testing_1.Helpers.onClose(() => {
        koaServer.close();
    }, true);
});
afterAll(hero_testing_1.Helpers.afterAll);
afterEach(hero_testing_1.Helpers.afterEach);
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
    const hero = new hero_testing_1.Hero();
    hero_testing_1.Helpers.onClose(() => hero.close(), true);
    hero.use(execute_js_plugin_1.default);
    await hero.goto(`${koaServer.baseUrl}/test2`);
    await hero.activeTab.waitForLoad(hero_1.LocationStatus.DomContentLoaded);
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
    hero_core_1.default.allowDynamicPluginLoading = false;
    const hero = new hero_testing_1.Hero();
    hero_testing_1.Helpers.onClose(() => hero.close(), true);
    hero.use(execute_js_plugin_1.default);
    await hero.goto(`${koaServer.baseUrl}/test2`);
    await hero.activeTab.waitForLoad(hero_1.LocationStatus.DomContentLoaded);
    // @ts-ignore
    const response = await hero.executeJs(() => {
        // @ts-ignore
        return window.testRun();
    });
    expect(response).toEqual(undefined);
    await hero.close();
});
//# sourceMappingURL=dependencies.test.js.map