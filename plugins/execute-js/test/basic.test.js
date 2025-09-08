"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hero_1 = require("@ulixee/hero");
const hero_testing_1 = require("@ulixee/hero-testing");
const hero_core_1 = require("@ulixee/hero-core");
const execute_js_plugin_1 = require("@ulixee/execute-js-plugin");
const CorePlugin_1 = require("../lib/CorePlugin");
let koaServer;
beforeAll(async () => {
    hero_core_1.default.use(CorePlugin_1.default);
    hero_core_1.default.allowDynamicPluginLoading = false;
    koaServer = await hero_testing_1.Helpers.runKoaServer();
    hero_testing_1.Helpers.onClose(() => {
        koaServer.close();
    }, true);
});
afterAll(hero_testing_1.Helpers.afterAll);
afterEach(hero_testing_1.Helpers.afterEach);
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
    const hero = new hero_testing_1.Hero();
    hero_testing_1.Helpers.onClose(() => hero.close());
    hero.use(execute_js_plugin_1.default);
    await hero.goto(`${koaServer.baseUrl}/test1`);
    await hero.activeTab.waitForLoad(hero_1.LocationStatus.DomContentLoaded);
    const response = await hero.executeJs(() => {
        // @ts-ignore
        return window.testRun();
    });
    expect(response).toEqual('ItWorks');
    await hero.close();
});
test('it can pass parameters and get results', async () => {
    koaServer.get('/test2', ctx => {
        ctx.body = `<body>
<script>
    window.testRun = function(num) {
      return num + 1;
    }
</script>
</body>`;
    });
    const hero = new hero_testing_1.Hero();
    hero_testing_1.Helpers.onClose(() => hero.close());
    hero.use(execute_js_plugin_1.default);
    await hero.goto(`${koaServer.baseUrl}/test2`);
    await hero.activeTab.waitForLoad(hero_1.LocationStatus.DomContentLoaded);
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
    const hero = new hero_testing_1.Hero();
    hero_testing_1.Helpers.onClose(() => hero.close());
    hero.use(execute_js_plugin_1.default);
    await hero.goto(`${koaServer.baseUrl}/iframe-host`);
    await hero.waitForPaintingStable();
    const iframe = await hero.getFrameEnvironment(hero.document.querySelector('iframe'));
    await iframe.waitForLoad(hero_1.LocationStatus.DomContentLoaded);
    await expect(iframe.executeJs(() => {
        // @ts-ignore
        return window.testFunc();
    })).resolves.toBe('iframe');
    await expect(hero.activeTab.executeJs(() => {
        // @ts-ignore
        return window.testFunc();
    })).resolves.toBe('page');
    await expect(hero.executeJs(() => {
        // @ts-ignore
        return window.testFunc();
    })).resolves.toBe('page');
    await hero.close();
});
//# sourceMappingURL=basic.test.js.map