import * as Fs from 'fs';
import * as Path from 'path';
import * as Helpers from '@ulixee/hero-testing/helpers';
import { inspect } from 'util';
import Puppet from '@ulixee/hero-puppet';
import Log from '@ulixee/commons/Logger';
import CorePlugins from '@ulixee/hero-core/lib/CorePlugins';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import BrowserEmulator from '../index';
import { getOverrideScript } from '../lib/DomOverridesBuilder';
import DomExtractor = require('./DomExtractor');

const { log } = Log(module);

const windowChromePath = Path.resolve(
  __dirname,
  '../data/as-chrome-88-0/as-mac-os-10-14/window-chrome.json',
);
const { chrome, prevProperty } = JSON.parse(Fs.readFileSync(windowChromePath, 'utf8')) as any;
const selectBrowserMeta = BrowserEmulator.selectBrowserMeta();

let puppet: Puppet;
beforeAll(async () => {
  puppet = new Puppet(selectBrowserMeta.browserEngine);
  Helpers.onClose(() => puppet.close(), true);
  await puppet.start();
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

async function createPage() {
  const plugins = new CorePlugins({ selectBrowserMeta }, log as IBoundLog);
  const context = await puppet.newContext(plugins, log);
  Helpers.onClose(() => context.close());
  const page = await context.newPage();
  page.on('page-error', console.log);
  if (debug) {
    page.on('console', console.log);
  }
  return page;
}
