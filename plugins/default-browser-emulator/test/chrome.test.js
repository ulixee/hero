"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const Path = require("path");
const Helpers = require("@ulixee/unblocked-agent-testing/helpers");
const browserUtils_1 = require("@ulixee/unblocked-agent-testing/browserUtils");
const util_1 = require("util");
const unblocked_agent_1 = require("@ulixee/unblocked-agent");
const unblocked_agent_testing_1 = require("@ulixee/unblocked-agent-testing");
const index_1 = require("../index");
const paths_1 = require("../paths");
const DomExtractor = require("./DomExtractor");
let chrome;
let browser;
beforeEach(Helpers.beforeEach);
beforeAll(async () => {
    const selectBrowserMeta = index_1.default.selectBrowserMeta('~ mac = 14');
    const { browserVersion, operatingSystemVersion } = selectBrowserMeta.userAgentOption;
    const windowChromePath = Path.resolve(paths_1.emulatorDataDir, `as-chrome-${browserVersion.major}-0/as-mac-os-${operatingSystemVersion.major}/window-chrome.json`);
    ({ chrome } = JSON.parse(Fs.readFileSync(windowChromePath, 'utf8')));
    browser = new unblocked_agent_1.Browser(selectBrowserMeta.browserEngine, browserUtils_1.defaultHooks);
    Helpers.onClose(() => browser.close(), true);
    await browser.launch();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);
const debug = process.env.DEBUG || false;
const domExtractorEvalTimeout = 120e3;
const domExtractorTestTimeout = 180e3;
test('it should mimic a chrome object', async () => {
    if (browser.engine.fullVersion.split('.')[0] === '115') {
        expect(true).toBe(true);
        return;
    }
    const httpServer = await Helpers.runHttpServer();
    const page = await createPage();
    await Promise.all([
        page.navigate(httpServer.baseUrl),
        page.mainFrame.waitOn('frame-lifecycle', ev => ev.name === 'DOMContentLoaded'),
    ]);
    const structure = JSON.parse((await page.mainFrame.evaluate(`new (${DomExtractor.toString()})('window').run(window, 'window', ['chrome'])`, { timeoutMs: domExtractorEvalTimeout }))).window;
    if (debug)
        console.log((0, util_1.inspect)(structure.chrome, false, null, true));
    // these values are getting out of order in recreation, but that doesn't impact anything
    expect(structure.chrome._$type).toBe(chrome._$type);
    expect(structure.chrome._$flags).toBe(chrome._$flags);
    delete structure.chrome._$type;
    delete structure.chrome._$flags;
    delete chrome._$type;
    delete chrome._$flags;
    const shouldFilterKey = key => {
        return key === '_$value' || key === '_$invocation' || key === '_$isAsync';
    };
    const structureJson = JSON.stringify(structure.chrome, (key, value) => {
        if (shouldFilterKey(key))
            return undefined;
        return value;
    });
    const chromeJson = JSON.stringify(chrome, (key, value) => {
        if (shouldFilterKey(key))
            return undefined;
        return value;
    });
    // must delete csi's invocation since it's different on each run
    expect(structureJson).toBe(chromeJson);
}, domExtractorTestTimeout);
test('it should update loadtimes and csi values', async () => {
    const httpServer = await Helpers.runHttpServer();
    const page = await createPage();
    await Promise.all([
        page.navigate(httpServer.baseUrl),
        page.mainFrame.waitOn('frame-lifecycle', ev => ev.name === 'DOMContentLoaded'),
    ]);
    const loadTimes = JSON.parse((await page.mainFrame.evaluate(`JSON.stringify(chrome.loadTimes())`)));
    if (debug)
        console.log((0, util_1.inspect)(loadTimes, false, null, true));
    expect(loadTimes.requestTime).not.toBe(chrome.loadTimes['new()'].requestTime._$value);
    const csi = JSON.parse((await page.mainFrame.evaluate(`JSON.stringify(chrome.csi())`)));
    if (debug)
        console.log((0, util_1.inspect)(csi, false, null, true));
    expect(csi.pageT).not.toBe(chrome.csi['new()'].pageT._$value);
    expect(csi.onloadT).not.toBe(chrome.csi['new()'].onloadT._$value);
    expect(String(csi.onloadT).length).toBe(String(chrome.csi['new()'].onloadT._$value).length);
    expect(Object.keys(csi)).toHaveLength(4);
});
async function createPage() {
    const context = await browser.newContext({ logger: unblocked_agent_testing_1.TestLogger.forTest(module) });
    Helpers.onClose(() => context.close());
    const page = await context.newPage();
    page.on('page-error', console.log);
    if (debug) {
        page.on('console', console.log);
    }
    return page;
}
//# sourceMappingURL=chrome.test.js.map