"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Helpers = require("@ulixee/unblocked-agent-testing/helpers");
const util_1 = require("util");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const unblocked_agent_1 = require("@ulixee/unblocked-agent");
const browserUtils_1 = require("@ulixee/unblocked-agent-testing/browserUtils");
const DomOverridesBuilder_1 = require("../lib/DomOverridesBuilder");
// @ts-ignore
// eslint-disable-next-line import/extensions
const _utils_1 = require("../injected-scripts/_utils");
const index_1 = require("../index");
const DomExtractor = require("./DomExtractor");
const IBrowserEmulatorConfig_1 = require("../interfaces/IBrowserEmulatorConfig");
const { log } = (0, Logger_1.default)(module);
const selectBrowserMeta = index_1.default.selectBrowserMeta();
let browser;
beforeEach(Helpers.beforeEach);
beforeAll(async () => {
    browser = new unblocked_agent_1.Browser(selectBrowserMeta.browserEngine, browserUtils_1.defaultHooks);
    Helpers.onClose(() => browser.close(), true);
    await browser.launch();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);
const debug = process.env.DEBUG || false;
test('should be able to override a function', async () => {
    class TestClass {
        doSomeWork(param) {
            return `${param} nope`;
        }
    }
    const holder = {
        tester: new TestClass(),
    };
    const win = {
        TestClass,
        holder,
    };
    (0, _utils_1.main)({ callback: () => { }, sourceUrl: 'test', targetType: 'node' });
    // @ts-ignore
    global.self = this;
    const hierarchy = JSON.parse(await new DomExtractor('window').run(win, 'win')).window;
    if (debug)
        console.log((0, util_1.inspect)(hierarchy, false, null, true));
    expect(win.holder.tester.doSomeWork('we')).toBe('we nope');
    (0, _utils_1.replaceFunction)(win.TestClass.prototype, 'doSomeWork', (target, thisArg, args) => {
        return `${target.apply(thisArg, args)} yep`;
    });
    const afterHierarchy = JSON.parse(await new DomExtractor('window').run(win, 'win')).window;
    if (debug)
        console.log((0, util_1.inspect)(afterHierarchy, false, null, true));
    expect(win.holder.tester.doSomeWork('oh')).toBe('oh nope yep');
    expect(afterHierarchy.TestClass.prototype.doSomeWork._$invocation).toBe('undefined nope yep');
    // these 2 will now be different in the structure
    delete hierarchy.TestClass.prototype.doSomeWork._$invocation;
    delete afterHierarchy.TestClass.prototype.doSomeWork._$invocation;
    expect(hierarchy).toStrictEqual(afterHierarchy);
});
test('should override a function and clean error stacks', async () => {
    const httpServer = await Helpers.runHttpServer();
    const context = await browser.newContext({ logger: log });
    Helpers.onClose(() => context.close());
    const page = await context.newPage();
    page.on('page-error', console.log);
    if (debug) {
        page.on('console', console.log);
    }
    await page.addNewDocumentScript((0, DomOverridesBuilder_1.getOverrideScript)(IBrowserEmulatorConfig_1.InjectedScript.NAVIGATOR_DEVICE_MEMORY, {
        memory: '4gb',
    }).script, false);
    await Promise.all([
        page.navigate(httpServer.baseUrl),
        page.mainFrame.waitOn('frame-lifecycle', ev => ev.name === 'DOMContentLoaded'),
    ]);
    const worksOnce = await page.evaluate(`navigator.permissions.query({ name: 'geolocation' }).then(x => x.state)`);
    expect(worksOnce).toBeTruthy();
    const perms = await page.evaluate(`(async () => {
    try {
      await navigator.permissions.query()
    } catch(err) {
      return err.stack;
    }
  })();`);
    expect(perms).not.toContain(DomOverridesBuilder_1.injectedSourceUrl);
});
test('should be able to combine multiple single instance overrides', async () => {
    class TestClass {
        doSomeWork(param) {
            return `${param} nope`;
        }
    }
    const a = new TestClass();
    const b = new TestClass();
    const c = new TestClass();
    (0, _utils_1.replaceFunction)(TestClass.prototype, 'doSomeWork', () => 'base');
    (0, _utils_1.replaceFunction)(a, 'doSomeWork', t => 'a', { onlyForInstance: true });
    (0, _utils_1.replaceFunction)(b, 'doSomeWork', () => 'b', { onlyForInstance: true });
    expect(a.doSomeWork('')).toBe('a');
    expect(b.doSomeWork('')).toBe('b');
    expect(c.doSomeWork('')).toBe('base');
    expect(a.doSomeWork === b.doSomeWork && b.doSomeWork === c.doSomeWork).toBeTruthy();
});
//# sourceMappingURL=utils.test.js.map