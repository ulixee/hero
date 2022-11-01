import * as Fs from 'fs';
import { inspect } from 'util';
import * as Helpers from '@ulixee/unblocked-plugins-testing/helpers';
import { Browser } from '@ulixee/unblocked-agent';
import { LoadStatus } from '@ulixee/unblocked-specification/agent/browser/Location';
import { IPage } from '@ulixee/unblocked-specification/agent/browser/IPage';
import { TestLogger } from '@ulixee/unblocked-plugins-testing';
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
  const httpServer = await Helpers.runHttpServer();
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
