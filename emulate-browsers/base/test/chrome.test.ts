import * as Helpers from '@secret-agent/testing/helpers';
import windowChrome from '@secret-agent/emulate-chrome-80/data/as-mac-os-10-14/window-chrome.json';
import { inspect } from 'util';
import BrowserEmulators from '@secret-agent/core/lib/BrowserEmulators';
import { GlobalPool } from '@secret-agent/core';
import Puppet from '@secret-agent/puppet';
import Log from '@secret-agent/commons/Logger';
import DomExtractor from './DomExtractor';
import { getOverrideScript } from '../lib/DomOverridesBuilder';

const { log } = Log(module);

const { chrome, prevProperty } = windowChrome as any;

let puppet: Puppet;
beforeAll(async () => {
  const engine = BrowserEmulators.getClass(GlobalPool.defaultBrowserEmulatorId).engine;
  puppet = new Puppet(engine);
  Helpers.onClose(() => puppet.close(), true);
  puppet.start();
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
    page.waitOn('frame-lifecycle', ev => ev.name === 'DOMContentLoaded'),
  ]);

  const structure = JSON.parse(
    (await page.mainFrame.evaluate(
      `new (${DomExtractor.toString()})('window').run(window, 'window', ['chrome'])`,
      false,
    )) as any,
  ).window;
  if (debug) console.log(inspect(structure.chrome, false, null, true));
  // must delete csi's invocation since it's different on each run
  delete structure.chrome.csi._$invocation;
  delete chrome.csi._$invocation;
  expect(structure.chrome).toStrictEqual(chrome);
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
    page.waitOn('frame-lifecycle', ev => ev.name === 'DOMContentLoaded'),
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
  const context = await puppet.newContext(
    {
      proxyPassword: '',
      platform: 'win32',
      locale: 'en',
      userAgent: 'Chrome Test',
      viewport: {
        screenHeight: 900,
        screenWidth: 1024,
        positionY: 0,
        positionX: 0,
        height: 900,
        width: 1024,
      },
    },
    log,
  );
  Helpers.onClose(() => context.close());
  const page = await context.newPage();
  page.on('page-error', console.log);
  if (debug) {
    page.on('console', console.log);
  }
  return page;
}
