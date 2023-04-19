import * as Fs from 'fs';
import * as Path from 'path';
import * as Helpers from '@ulixee/unblocked-agent-testing/helpers';
import { defaultHooks } from '@ulixee/unblocked-agent-testing/browserUtils';
import { inspect } from 'util';
import { Browser } from '@ulixee/unblocked-agent';
import Page from '@ulixee/unblocked-agent/lib/Page';
import { TestLogger } from '@ulixee/unblocked-agent-testing';
import BrowserEmulator from '../index';
import { getOverrideScript } from '../lib/DomOverridesBuilder';
import { emulatorDataDir } from '../paths';
import DomExtractor = require('./DomExtractor');

let chrome;
let prevProperty: string;
let browser: Browser;

beforeEach(Helpers.beforeEach);
beforeAll(async () => {
  const selectBrowserMeta = BrowserEmulator.selectBrowserMeta('~ mac = 10.14');
  const { browserVersion, operatingSystemVersion } = selectBrowserMeta.userAgentOption;
  const windowChromePath = Path.resolve(
    emulatorDataDir,
    `as-chrome-${browserVersion.major}-0/as-mac-os-${operatingSystemVersion.major}-${operatingSystemVersion.minor}/window-chrome.json`,
  );
  ({ chrome, prevProperty } = JSON.parse(Fs.readFileSync(windowChromePath, 'utf8')) as any);
  browser = new Browser(selectBrowserMeta.browserEngine, defaultHooks);
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
    page.navigate(httpServer.baseUrl),
    page.mainFrame.waitOn('frame-lifecycle', ev => ev.name === 'DOMContentLoaded'),
  ]);

  const structure = JSON.parse(
    (await page.mainFrame.evaluate(
      `new (${DomExtractor.toString()})('window').run(window, 'window', ['chrome'])`,
      false,
    )) as any,
  ).window;
  if (debug) console.log(inspect(structure.chrome, false, null, true));

  // these values are getting out of order in recreation, but that doesn't impact anything
  expect(structure.chrome._$type).toBe(chrome._$type);
  expect(structure.chrome._$flags).toBe(chrome._$flags);
  delete structure.chrome._$type;
  delete structure.chrome._$flags;
  delete chrome._$type;
  delete chrome._$flags;

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
    page.navigate(httpServer.baseUrl),
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
  const context = await browser.newContext({ logger: TestLogger.forTest(module) });
  Helpers.onClose(() => context.close());
  const page = await context.newPage();
  page.on('page-error', console.log);
  if (debug) {
    page.on('console', console.log);
  }
  return page;
}
