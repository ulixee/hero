import * as Fs from 'fs';
import * as Path from 'path';
import * as Helpers from '@unblocked/sa-testing/helpers';
import { inspect } from 'util';
import { Browser } from '@unblocked/secret-agent';
import Log from '@ulixee/commons/lib/Logger';
import BrowserEmulator from '../index';
import { getOverrideScript } from '../lib/DomOverridesBuilder';
import Page from '@unblocked/secret-agent/lib/Page';
import DomExtractor = require('./DomExtractor');

const { log } = Log(module);
const selectBrowserMeta = BrowserEmulator.selectBrowserMeta('~ mac = 10.14');

let chrome;
let prevProperty: string;
let browser: Browser;
beforeAll(async () => {
  const { browserVersion, operatingSystemVersion } = selectBrowserMeta.userAgentOption;
  const windowChromePath = Path.resolve(
    __dirname,
    `../data/as-chrome-${browserVersion.major}-0/as-mac-os-${operatingSystemVersion.major}-${operatingSystemVersion.minor}/window-chrome.json`,
  );
  ({ chrome, prevProperty } = JSON.parse(Fs.readFileSync(windowChromePath, 'utf8')) as any);
  browser = new Browser(selectBrowserMeta.browserEngine);
  Helpers.onClose(() => browser.close(), true);
  await browser.launch();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

const debug = process.env.DEBUG || false;

test('it should mimic a chrome object', async () => {
  const httpServer = await Helpers.runHttpServer();
  const page = await createPage();
  const script = getOverrideScript('window.chrome', {
    polyfill: {
      property: chrome,
      prevProperty,
    },
  }).script;
  await page.addNewDocumentScript(script, false);
  await Promise.all([
    page.navigate(httpServer.url),
    page.mainFrame.waitOn('frame-lifecycle', ev => ev.name === 'DOMContentLoaded'),
  ]);

  const structure = JSON.parse(
    (await page.mainFrame.evaluate(
      `new (${DomExtractor.toString()})('window').run(window, 'window', ['chrome'])`,
      false,
    )) as any,
  ).window;
  if (debug) console.log(inspect(structure.chrome, false, null, true));

  const structureJson = JSON.stringify(structure.chrome, (key, value) => {
    if (key === '_$value' || key === '_$invocation') return undefined;
    return value;
  });

  const chromeJson = JSON.stringify(chrome, (key, value) => {
    if (key === '_$value' || key === '_$invocation') return undefined;
    return value;
  });
  // must delete csi's invocation since it's different on each run
  expect(structureJson).toBe(chromeJson);
}, 60e3);

test('it should update loadtimes and csi values', async () => {
  const httpServer = await Helpers.runHttpServer();
  const page = await createPage();
  await page.addNewDocumentScript(
    getOverrideScript('window.chrome', {
      updateLoadTimes: true,
      polyfill: {
        property: chrome,
        prevProperty,
      },
    }).script,
    false,
  );
  await Promise.all([
    page.navigate(httpServer.url),
    page.mainFrame.waitOn('frame-lifecycle', ev => ev.name === 'DOMContentLoaded'),
  ]);

  const loadTimes = JSON.parse(
    (await page.mainFrame.evaluate(`JSON.stringify(chrome.loadTimes())`, false)) as any,
  );
  if (debug) console.log(inspect(loadTimes, false, null, true));
  expect(loadTimes.requestTime).not.toBe(chrome.loadTimes['new()'].requestTime._$value);

  const csi = JSON.parse(
    (await page.mainFrame.evaluate(`JSON.stringify(chrome.csi())`, false)) as any,
  );
  if (debug) console.log(inspect(csi, false, null, true));
  expect(csi.pageT).not.toBe(chrome.csi['new()'].pageT._$value);

  expect(csi.onloadT).not.toBe(chrome.csi['new()'].onloadT._$value);
  expect(String(csi.onloadT).length).toBe(String(chrome.csi['new()'].onloadT._$value).length);
  expect(Object.keys(csi)).toHaveLength(4);
}, 60e3);

async function createPage(): Promise<Page> {
  const emulator = new BrowserEmulator({ ...selectBrowserMeta, logger: log });
  const context = await browser.newContext(emulator);
  context.hook(emulator)
  Helpers.onClose(() => context.close());
  const page = await context.newPage();
  page.on('page-error', console.log);
  if (debug) {
    page.on('console', console.log);
  }
  return page;
}
