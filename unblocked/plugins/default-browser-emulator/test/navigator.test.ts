import * as Fs from 'fs';
import { inspect } from 'util';
import * as Helpers from '@ulixee/unblocked-agent-testing/helpers';
import { Browser } from '@ulixee/unblocked-agent';
import { LoadStatus } from '@ulixee/unblocked-specification/agent/browser/Location';
import { IPage } from '@ulixee/unblocked-specification/agent/browser/IPage';
import { TestLogger } from '@ulixee/unblocked-agent-testing';
import BrowserEmulator from '../index';
import * as pluginsChrome from './plugins-Chrome.json';
import { getOverrideScript } from '../lib/DomOverridesBuilder';
import parseNavigatorPlugins from '../lib/utils/parseNavigatorPlugins';
import DomExtractor = require('./DomExtractor');
import { emulatorDataDir } from '../paths';

const logger = TestLogger.forTest(module);

let navigatorConfig: any;
let browser: Browser;
beforeEach(Helpers.beforeEach);
beforeAll(async () => {
  const selectBrowserMeta = BrowserEmulator.selectBrowserMeta('~ mac = 10.15');
  const { browserVersion, operatingSystemVersion } = selectBrowserMeta.userAgentOption;
  const asOsDataDir = `${emulatorDataDir}/as-chrome-${browserVersion.major}-0/as-mac-os-${operatingSystemVersion.major}-${operatingSystemVersion.minor}`;

  const navigatorJsonPath = `${asOsDataDir}/window-navigator.json`;
  ({ navigator: navigatorConfig } = JSON.parse(Fs.readFileSync(navigatorJsonPath, 'utf8')) as any);
  browser = new Browser(selectBrowserMeta.browserEngine);
  Helpers.onClose(() => browser.close(), true);
  await browser.launch();
});

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

const debug = process.env.DEBUG || false;

test('it should override plugins in a browser window', async () => {
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
  await page.addNewDocumentScript(
    getOverrideScript('navigator.plugins', pluginsData).script,
    false,
  );
  await page.goto(httpServer.baseUrl);
  await page.waitForLoad(LoadStatus.DomContentLoaded);

  const hasPlugins = await page.mainFrame.evaluate(
    `'plugins' in navigator && 'mimeTypes' in navigator`,
    false,
  );
  expect(hasPlugins).toBe(true);

  const pluginCount = await page.mainFrame.evaluate(`navigator.plugins.length`, false);
  expect(pluginCount).toBe(pluginsData.plugins.length);

  const plugin1Mimes = await page.mainFrame.evaluate(
    `(() => {
  let mimes = [];
  for(const mime of navigator.plugins[0]) {
    mimes.push(mime.type);
  }
  return mimes;
})()`,
    false,
  );
  expect(plugin1Mimes).toStrictEqual(pluginsData.mimeTypes.map(x => x.type));

  const mimecount = await page.mainFrame.evaluate(`navigator.mimeTypes.length`, false);
  expect(mimecount).toBe(pluginsData.mimeTypes.length);

  const structure = JSON.parse(
    (await page.mainFrame.evaluate(
      `new (${DomExtractor.toString()})('window').run(window, 'window',  ['Plugin', 'PluginArray', 'MimeType', 'MimeTypeArray','navigator'])`,
      false,
    )) as any,
  ).window;

  for (const proto of ['Plugin', 'PluginArray', 'MimeType', 'MimeTypeArray']) {
    if (debug) console.log(proto, inspect(structure[proto], false, null, true));
    expect(structure[proto]).toStrictEqual(pluginsChrome[proto]);
  }
  const navigatorPageStructure = structure.navigator;
  if (debug) {
    console.log('Installed', inspect(navigatorPageStructure.mimeTypes, false, null, true));
    console.log('Expected', inspect(navigatorConfig.mimeTypes, false, null, true));
  }
  expect(navigatorPageStructure.mimeTypes).toStrictEqual(navigatorConfig.mimeTypes);

  if (debug) console.log(inspect(navigatorPageStructure.plugins, false, null, true));
  expect(navigatorPageStructure.plugins).toStrictEqual(navigatorConfig.plugins);
}, 60e3);

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
    getOverrideScript('navigator.deviceMemory', {
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
  await page.addNewDocumentScript(getOverrideScript('navigator.plugins', pluginsData).script, false);
  await page.goto(httpServer.baseUrl);
  await page.waitForLoad(LoadStatus.DomContentLoaded);

  // should handle Uint32 overflows
  await expect(
    page.mainFrame.evaluate<boolean>(
      `navigator.plugins.item(4294967296) === navigator.plugins[0]`,
      false,
    ),
  ).resolves.toBe(true);

  // should correctly support instance references
  await expect(
    page.mainFrame.evaluate<boolean>(
      `navigator.plugins[0][0].enabledPlugin === navigator.plugins[0]`,
      false,
    ),
  ).resolves.toBe(true);

  await expect(
    page.mainFrame.evaluate<boolean>('navigator.plugins[0][0] === navigator.plugins[0][0]', false),
  ).resolves.toBe(false);
});

test('it should override userAgentData in a browser window', async () => {
  const httpServer = await Helpers.runHttpsServer((req, res) => {
    res.end('<html><head></head><body>Hi</body></html>');
  });
  const brands: { version: string; brand: string }[] = [];
  for (let i = 0; i < 3; i += 1) {
    const { brand, version } = navigatorConfig.userAgentData.brands[i];
    brands.push({ brand: brand._$value, version: version._$value });
  }
  const context = await browser.newContext({
    logger,
    hooks: {
      onNewPage(page: IPage): Promise<any> {
        return page.addNewDocumentScript(
          getOverrideScript('navigator', {
            userAgentData: {
              brands,
              platform: 'macOS',
              mobile: false,
            },
          }).script,
          false,
        );
      },
    },
  });
  Helpers.onClose(() => context.close());

  const page = await context.newPage();

  page.on('page-error', console.log);
  if (debug) {
    page.on('console', console.log);
  }
  const pluginsData = {};
  if (debug) console.log(pluginsData);

  await page.goto(httpServer.url);
  await page.waitForLoad(LoadStatus.DomContentLoaded);

  const structure = JSON.parse(
    (await page.mainFrame.evaluate(
      `new (${DomExtractor.toString()})('window').run(window, 'window',  ['NavigatorUAData','navigator'])`,
      false,
    )) as any,
  ).window;

  for (const proto of ['NavigatorUAData']) {
    if (debug) console.log(proto, inspect(structure[proto], false, null, true));
    expect(structure[proto]).toStrictEqual(pluginsChrome[proto]);
  }
  const navigatorPageStructure = structure.navigator;
  if (debug) {
    console.log('Installed', inspect(navigatorPageStructure, false, null, true));
    console.log('Expected', inspect(navigatorConfig, false, null, true));
  }
  expect(navigatorPageStructure.userAgentData).toStrictEqual(navigatorConfig.userAgentData);
}, 60e3);
