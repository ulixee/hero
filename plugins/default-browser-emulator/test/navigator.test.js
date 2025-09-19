"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const Helpers = require("@ulixee/unblocked-agent-testing/helpers");
const unblocked_agent_1 = require("@ulixee/unblocked-agent");
const Location_1 = require("@ulixee/unblocked-specification/agent/browser/Location");
const unblocked_agent_testing_1 = require("@ulixee/unblocked-agent-testing");
const browserUtils_1 = require("@ulixee/unblocked-agent-testing/browserUtils");
const index_1 = require("../index");
const DomOverridesBuilder_1 = require("../lib/DomOverridesBuilder");
const parseNavigatorPlugins_1 = require("../lib/utils/parseNavigatorPlugins");
const paths_1 = require("../paths");
const IBrowserEmulatorConfig_1 = require("../interfaces/IBrowserEmulatorConfig");
const logger = unblocked_agent_testing_1.TestLogger.forTest(module);
let navigatorConfig;
let browser;
beforeEach(Helpers.beforeEach);
beforeAll(async () => {
    const selectBrowserMeta = index_1.default.selectBrowserMeta('~ mac');
    const { browserVersion, operatingSystemVersion } = selectBrowserMeta.userAgentOption;
    const asOsDataDir = `${paths_1.emulatorDataDir}/as-chrome-${browserVersion.major}-0/as-mac-os-${operatingSystemVersion.major}`;
    const navigatorJsonPath = `${asOsDataDir}/window-navigator.json`;
    ({ navigator: navigatorConfig } = JSON.parse(Fs.readFileSync(navigatorJsonPath, 'utf8')));
    browser = new unblocked_agent_1.Browser(selectBrowserMeta.browserEngine, browserUtils_1.defaultHooks);
    Helpers.onClose(() => browser.close(), true);
    await browser.launch();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);
const debug = process.env.DEBUG || false;
test('it should not be able to detect incognito', async () => {
    const httpServer = await Helpers.runHttpsServer((req, res) => {
        res.end('<html><head></head><body>Hi</body></html>');
    }, false);
    const context = await browser.newContext({ logger });
    Helpers.onClose(() => context.close());
    const page = await context.newPage();
    page.on('page-error', console.log);
    if (debug) {
        page.on('console', console.log);
    }
    await page.addNewDocumentScript((0, DomOverridesBuilder_1.getOverrideScript)(IBrowserEmulatorConfig_1.InjectedScript.NAVIGATOR_DEVICE_MEMORY, {
        memory: 4,
        storageTib: 0.5,
        maxHeapSize: 2172649472,
    }).script, false);
    await page.goto(httpServer.baseUrl);
    await page.waitForLoad(Location_1.LoadStatus.DomContentLoaded);
    const storageEstimate = await page.evaluate(`(async () => { 
      return (await navigator.storage.estimate()).quota;
    })()`);
    // NOTE: this has some false positive as written, but this amount of temporary quota is highly suspicious
    // https://github.com/Joe12387/detectIncognito/issues/21
    const storageEstimateInMib = Math.round(storageEstimate / (1024 * 1024));
    const quotaLimit = await page.evaluate(`performance.memory.jsHeapSizeLimit`);
    const quotaLimitInMib = Math.round(quotaLimit / (1024 * 1024)) * 2;
    const tempQuota = await page.evaluate(`new Promise((resolve, reject) => {
    navigator.webkitTemporaryStorage.queryUsageAndQuota(
      (_, quota) => resolve(quota),
      reject,
    );
  })`);
    const tempQuotaInMib = Math.round(tempQuota / (1024 * 1024));
    expect(quotaLimitInMib).toBeLessThanOrEqual(tempQuotaInMib);
});
test('it should handle overflows in plugins', async () => {
    const httpServer = await Helpers.runKoaServer(false);
    const context = await browser.newContext({ logger });
    Helpers.onClose(() => context.close());
    const page = await context.newPage();
    page.on('page-error', console.log);
    if (debug) {
        page.on('console', console.log);
    }
    const pluginsData = (0, parseNavigatorPlugins_1.default)(navigatorConfig);
    if (debug)
        console.log(pluginsData);
    await page.goto(httpServer.baseUrl);
    await page.waitForLoad(Location_1.LoadStatus.DomContentLoaded);
    // should handle Uint32 overflows
    await expect(page.mainFrame.evaluate(`navigator.plugins.item(4294967296) === navigator.plugins[0]`)).resolves.toBe(true);
    // should correctly support instance references
    await expect(page.mainFrame.evaluate(`navigator.plugins[0][0].enabledPlugin === navigator.plugins[0]`)).resolves.toBe(true);
    await expect(page.mainFrame.evaluate('navigator.plugins[0][0] === navigator.plugins[0][0]')).resolves.toBe(false);
});
//# sourceMappingURL=navigator.test.js.map