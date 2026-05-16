"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hero_testing_1 = require("@ulixee/hero-testing");
const hero_core_1 = require("@ulixee/hero-core");
const execute_js_plugin_1 = require("@ulixee/execute-js-plugin");
const net_1 = require("@ulixee/net");
const hero_1 = require("@ulixee/hero");
let core;
let connectionToCore;
afterAll(hero_testing_1.Helpers.afterAll);
afterEach(async () => {
    await hero_testing_1.Helpers.afterEach();
    await core.close();
});
beforeEach(async () => {
    core = await hero_core_1.default.start();
    const bridge = new net_1.TransportBridge();
    core.addConnection(bridge.transportToClient);
    connectionToCore = new hero_1.ConnectionToHeroCore(bridge.transportToCore);
});
test('it should receive a custom config', async () => {
    const testConfig = { test: 'testData' };
    const constructor = jest.fn();
    const shouldActivate = jest.fn();
    class TestingExecuteJsCorePlugin1 extends execute_js_plugin_1.CorePlugin {
        constructor(opts) {
            super(opts);
            constructor(opts.customConfig);
        }
        static shouldActivate(_emulationProfile, _sessionSummary, customConfig) {
            shouldActivate(customConfig);
            return true;
        }
    }
    TestingExecuteJsCorePlugin1.id = 'TestingExecuteJsCorePlugin1';
    core.use(TestingExecuteJsCorePlugin1);
    const hero = new hero_testing_1.Hero({
        connectionToCore,
        pluginConfigs: {
            [TestingExecuteJsCorePlugin1.id]: testConfig,
        },
    });
    hero_testing_1.Helpers.onClose(() => hero.close(), true);
    await hero.sessionId;
    expect(constructor).toHaveBeenCalledWith(testConfig);
    expect(shouldActivate).toHaveBeenCalledWith(testConfig);
    await hero.close();
});
test('it should not activate if config === false', async () => {
    const constructor = jest.fn();
    const shouldActivate = jest.fn();
    class TestingExecuteJsCorePlugin2 extends execute_js_plugin_1.CorePlugin {
        constructor(opts) {
            super(opts);
            constructor();
        }
        static shouldActivate() {
            shouldActivate();
            return true;
        }
    }
    TestingExecuteJsCorePlugin2.id = 'TestingExecuteJsCorePlugin2';
    core.use(TestingExecuteJsCorePlugin2);
    const hero = new hero_testing_1.Hero({
        pluginConfigs: {
            [TestingExecuteJsCorePlugin2.id]: false,
        },
    });
    hero_testing_1.Helpers.onClose(() => hero.close(), true);
    await hero.sessionId;
    expect(shouldActivate).not.toHaveBeenCalled();
    expect(constructor).not.toHaveBeenCalled();
    await hero.close();
});
test('it should skip shouldActivate if config === true', async () => {
    const constructor = jest.fn();
    const shouldActivate = jest.fn();
    class TestingExecuteJsCorePlugin3 extends execute_js_plugin_1.CorePlugin {
        constructor(opts) {
            super(opts);
            constructor();
        }
        static shouldActivate() {
            shouldActivate();
            return false;
        }
    }
    TestingExecuteJsCorePlugin3.id = 'TestingExecuteJsCorePlugin3';
    core.use(TestingExecuteJsCorePlugin3);
    const hero = new hero_testing_1.Hero({
        pluginConfigs: {
            [TestingExecuteJsCorePlugin3.id]: true,
        },
    });
    hero_testing_1.Helpers.onClose(() => hero.close(), true);
    await hero.sessionId;
    expect(shouldActivate).not.toHaveBeenCalled();
    expect(constructor).toHaveBeenCalled();
    await hero.close();
});
//# sourceMappingURL=config.test.js.map