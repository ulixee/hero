import * as Fs from 'fs';
import * as Helpers from '@ulixee/unblocked-agent-testing/helpers';
import { Browser } from '@ulixee/unblocked-agent';
import { LoadStatus } from '@ulixee/unblocked-specification/agent/browser/Location';
import { TestLogger } from '@ulixee/unblocked-agent-testing';
import { defaultHooks } from '@ulixee/unblocked-agent-testing/browserUtils';
import BrowserEmulator from '../index';
import { getOverrideScript } from '../lib/DomOverridesBuilder';
import parseNavigatorPlugins from '../lib/utils/parseNavigatorPlugins';
import { emulatorDataDir } from '../paths';
import { InjectedScript } from '../interfaces/IBrowserEmulatorConfig';

const logger = TestLogger.forTest(module);

let navigatorConfig: any;
let browser: Browser;
beforeEach(Helpers.beforeEach);
beforeAll(async () => {
  const selectBrowserMeta = BrowserEmulator.selectBrowserMeta('~ mac');
  const { browserVersion, operatingSystemVersion } = selectBrowserMeta.userAgentOption;
  const asOsDataDir = `${emulatorDataDir}/as-chrome-${browserVersion.major}-0/as-mac-os-${operatingSystemVersion.major}`;

  const navigatorJsonPath = `${asOsDataDir}/window-navigator.json`;
  ({ navigator: navigatorConfig } = JSON.parse(Fs.readFileSync(navigatorJsonPath, 'utf8')) as any);
  browser = new Browser(selectBrowserMeta.browserEngine, defaultHooks);
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

  await page.addNewDocumentScript(
    getOverrideScript(InjectedScript.NAVIGATOR_DEVICE_MEMORY, {
      memory: 4,
      storageTib: 0.5,
      maxHeapSize: 2172649472,
    }).script,
    false,
  );
  await page.goto(httpServer.baseUrl);
  await page.waitForLoad(LoadStatus.DomContentLoaded);

  const storageEstimate = await page.evaluate<number>(
    `(async () => { 
      return (await navigator.storage.estimate()).quota;
    })()`,
  );
  // NOTE: this has some false positive as written, but this amount of temporary quota is highly suspicious
  // https://github.com/Joe12387/detectIncognito/issues/21
  const storageEstimateInMib = Math.round(storageEstimate / (1024 * 1024));
  const quotaLimit = await page.evaluate<number>(`performance.memory.jsHeapSizeLimit`);
  const quotaLimitInMib = Math.round(quotaLimit / (1024 * 1024)) * 2;
  const tempQuota = await page.evaluate<number>(`new Promise((resolve, reject) => {
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
  const pluginsData = parseNavigatorPlugins(navigatorConfig);
  if (debug) console.log(pluginsData);
  await page.goto(httpServer.baseUrl);
  await page.waitForLoad(LoadStatus.DomContentLoaded);

  // should handle Uint32 overflows
  await expect(
    page.mainFrame.evaluate<boolean>(`navigator.plugins.item(4294967296) === navigator.plugins[0]`),
  ).resolves.toBe(true);

  // should correctly support instance references
  await expect(
    page.mainFrame.evaluate<boolean>(
      `navigator.plugins[0][0].enabledPlugin === navigator.plugins[0]`,
    ),
  ).resolves.toBe(true);

  await expect(
    page.mainFrame.evaluate<boolean>('navigator.plugins[0][0] === navigator.plugins[0][0]'),
  ).resolves.toBe(false);
});
