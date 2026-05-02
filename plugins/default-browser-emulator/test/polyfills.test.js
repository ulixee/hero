"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
const Helpers = require("@ulixee/unblocked-agent-testing/helpers");
const browserUtils_1 = require("@ulixee/unblocked-agent-testing/browserUtils");
const unblocked_agent_1 = require("@ulixee/unblocked-agent");
const unblocked_agent_testing_1 = require("@ulixee/unblocked-agent-testing");
const DomOverridesBuilder_1 = require("../lib/DomOverridesBuilder");
const DomExtractor = require("./DomExtractor");
const IBrowserEmulatorConfig_1 = require("../interfaces/IBrowserEmulatorConfig");
let browser;
let httpServer;
let context;
beforeEach(Helpers.beforeEach);
beforeAll(async () => {
    browser = new unblocked_agent_1.Browser(browserUtils_1.defaultBrowserEngine, browserUtils_1.defaultHooks);
    Helpers.onClose(() => browser.close(), true);
    await browser.launch();
    context = await browser.newContext({ logger: unblocked_agent_testing_1.TestLogger.forTest(module) });
    Helpers.onClose(() => context.close().catch(), true);
    httpServer = await Helpers.runKoaServer(true);
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);
const debug = process.env.DEBUG || false;
const domExtractorEvalTimeout = 120e3;
const domExtractorTestTimeout = 180e3;
test('it should be able to add polyfills', async () => {
    if (browser.engine.fullVersion.split('.')[0] === '115') {
        expect(true).toBe(true);
        return;
    }
    const page = await createPage();
    const objectTestProperties = {
        length: {
            _$type: 'number',
            _$flags: 'c',
            _$value: 0,
        },
        name: {
            _$type: 'string',
            _$flags: 'c',
            _$value: 'ObjectTest',
        },
        arguments: {
            _$type: 'object',
            _$flags: '',
            _$value: null,
        },
        caller: {
            _$type: 'object',
            _$flags: '',
            _$value: null,
        },
        prototype: {
            _$protos: ['Object.prototype'],
            creationTime: {
                _$flags: 'ce',
                _$accessException: 'TypeError: Illegal invocation',
                _$get: 'function get creationTime() { [native code] }',
                _$getToStringToString: 'function toString() { [native code] }',
            },
            'Symbol(Symbol.toStringTag)': {
                _$type: 'string',
                _$flags: 'c',
                _$value: 'ObjectTest',
            },
            _$type: 'object',
            _$flags: '',
        },
        'new()': {
            _$protos: ['ObjectTest.prototype', 'Object.prototype'],
            _$type: 'constructor',
        },
        _$type: 'function',
        _$function: 'function ObjectTest() { [native code] }',
        _$flags: 'cw',
        _$value: 'function ObjectTest() { [native code] }',
        _$invocation: "TypeError: Cannot read property '0' of undefined",
    };
    if (browser.majorVersion >= 139) {
        delete objectTestProperties.arguments;
        delete objectTestProperties.caller;
    }
    const chromeProperty = {
        _$flags: 'ce',
        _$type: 'string',
        _$value: 'I am chrome',
    };
    await page.addNewDocumentScript((0, DomOverridesBuilder_1.getOverrideScript)(IBrowserEmulatorConfig_1.InjectedScript.POLYFILL_ADD, {
        itemsToAdd: [
            {
                path: 'window',
                propertyName: 'chromey',
                prevProperty: 'Atomics',
                property: chromeProperty,
            },
            {
                path: 'window',
                propertyName: 'ObjectTest',
                prevProperty: 'chromey',
                property: objectTestProperties,
            },
        ],
    }).script, false);
    await Promise.all([
        page.navigate(httpServer.baseUrl),
        page.mainFrame.waitOn('frame-lifecycle', event => event.name === 'load'),
    ]);
    const json = await page.mainFrame.evaluate(`new (${DomExtractor.toString()})('window').run(window, 'window', ['windowKeys','chromey','ObjectTest'])`, { timeoutMs: domExtractorEvalTimeout });
    const result = JSON.parse(json);
    const windowKeys = result.windowKeys;
    const window = result.window;
    // test chrome property
    if (debug) {
        console.log('chromey', (0, util_1.inspect)(window.chromey, false, null, true));
    }
    expect(window.chromey).toStrictEqual(chromeProperty);
    expect(windowKeys.indexOf('chromey')).toBe(windowKeys.indexOf('Atomics') + 1);
    // test ObjectTest property
    if (debug) {
        console.log('ObjectTest', (0, util_1.inspect)(window.ObjectTest, false, null, true));
    }
    expect(window.ObjectTest).toStrictEqual(objectTestProperties);
    expect(windowKeys.indexOf('ObjectTest')).toBe(windowKeys.indexOf('chromey') + 1);
}, domExtractorTestTimeout);
test('it should be able to remove properties', async () => {
    const page = await createPage();
    await page.addNewDocumentScript((0, DomOverridesBuilder_1.getOverrideScript)(IBrowserEmulatorConfig_1.InjectedScript.POLYFILL_REMOVE, {
        itemsToRemove: [
            { path: 'window', propertyName: 'Atomics' },
            { path: 'window.Array', propertyName: 'from' },
        ],
    }).script, false);
    await Promise.all([
        page.navigate(httpServer.baseUrl),
        page.mainFrame.waitOn('frame-lifecycle', event => event.name === 'load'),
    ]);
    expect(await page.mainFrame.evaluate(`!!window.Atomics`)).not.toBeTruthy();
    expect(await page.mainFrame.evaluate(`!!Array.from`)).not.toBeTruthy();
});
test('it should be able to change properties', async () => {
    const page = await createPage();
    await page.addNewDocumentScript((0, DomOverridesBuilder_1.getOverrideScript)(IBrowserEmulatorConfig_1.InjectedScript.POLYFILL_MODIFY, {
        itemsToModify: [
            {
                path: 'window.Navigator.prototype.registerProtocolHandler.name',
                propertyName: '_$value',
                property: 'notTheRightName',
            },
            {
                path: 'window.Navigator.prototype.registerProtocolHandler',
                propertyName: '_$function',
                property: 'function registerProtocolHandler() { [unnative code] }',
            },
        ],
    }).script, false);
    await Promise.all([
        page.navigate(httpServer.baseUrl),
        page.mainFrame.waitOn('frame-lifecycle', event => event.name === 'load'),
    ]);
    const protocolToString = await page.mainFrame.evaluate(`window.Navigator.prototype.registerProtocolHandler.toString()`);
    const protocolName = await page.mainFrame.evaluate(`window.Navigator.prototype.registerProtocolHandler.name`);
    expect(protocolName).toBe('notTheRightName');
    expect(protocolToString).toBe('function registerProtocolHandler() { [unnative code] }');
});
test('it should be able to change property order', async () => {
    const page = await createPage();
    const startNavigatorKeys = (await page.mainFrame.evaluate(`Object.keys(window.Navigator.prototype)`));
    await page.addNewDocumentScript((0, DomOverridesBuilder_1.getOverrideScript)(IBrowserEmulatorConfig_1.InjectedScript.POLYFILL_REORDER, {
        itemsToReorder: [
            {
                path: 'window.Navigator.prototype',
                propertyName: startNavigatorKeys[10],
                throughProperty: startNavigatorKeys[12],
                prevProperty: startNavigatorKeys[1],
            },
            {
                path: 'window.Navigator.prototype',
                propertyName: startNavigatorKeys[18],
                throughProperty: startNavigatorKeys[18],
                prevProperty: startNavigatorKeys[12],
            },
        ],
    }).script, false);
    await new Promise(setImmediate);
    await Promise.all([
        page.navigate(httpServer.baseUrl),
        page.mainFrame.waitOn('frame-lifecycle', event => event.name === 'load'),
    ]);
    const keyOrder = (await page.mainFrame.evaluate(`Object.keys(window.Navigator.prototype)`));
    const prop1Index = keyOrder.indexOf(startNavigatorKeys[10]);
    expect(keyOrder[prop1Index - 1]).toBe(startNavigatorKeys[1]);
    const prop2Index = keyOrder.indexOf(startNavigatorKeys[18]);
    expect(keyOrder[prop2Index - 1]).toBe(startNavigatorKeys[12]);
});
test('it should be able to change window property order', async () => {
    const page = await createPage();
    const windowKeys = await page.mainFrame.evaluate(`Object.keys(window)`);
    const itemsToReorder = [
        {
            path: 'window',
            propertyName: windowKeys[10],
            throughProperty: windowKeys[12],
            prevProperty: windowKeys[1],
        },
        {
            path: 'window',
            propertyName: windowKeys[18],
            throughProperty: windowKeys[18],
            prevProperty: windowKeys[12],
        },
        {
            path: 'window',
            propertyName: windowKeys[25],
            throughProperty: windowKeys[50],
            prevProperty: windowKeys[23],
        },
    ];
    await page.addNewDocumentScript((0, DomOverridesBuilder_1.getOverrideScript)(IBrowserEmulatorConfig_1.InjectedScript.POLYFILL_REORDER, {
        itemsToReorder,
    }).script, false);
    await Promise.all([
        page.navigate(httpServer.baseUrl),
        page.mainFrame.waitOn('frame-lifecycle', event => event.name === 'load'),
    ]);
    const windowKeysAfter = (await page.mainFrame.evaluate(`Object.keys(window)`));
    const prop1Index = windowKeysAfter.indexOf(windowKeys[10]);
    expect(windowKeysAfter[prop1Index - 1]).toBe(windowKeys[1]);
    const prop2Index = windowKeysAfter.indexOf(windowKeys[18]);
    expect(windowKeysAfter[prop2Index - 1]).toBe(windowKeys[12]);
    const prop3Index = windowKeysAfter.indexOf(windowKeys[25]);
    expect(windowKeysAfter[prop3Index - 1]).toBe(windowKeys[23]);
    expect(windowKeysAfter.indexOf(windowKeys[26])).toBe(prop3Index + 1);
    expect(windowKeysAfter.indexOf(windowKeys[50])).toBe(prop3Index + 25);
}, 10e3);
async function createPage() {
    const page = await context.newPage();
    Helpers.onClose(() => page.close());
    page.on('page-error', console.log);
    if (debug) {
        page.on('console', console.log);
    }
    return page;
}
//# sourceMappingURL=polyfills.test.js.map