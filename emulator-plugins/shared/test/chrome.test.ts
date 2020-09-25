import * as Helpers from '@secret-agent/testing/helpers';
import ChromeJson from '@secret-agent/emulate-chrome-80/chrome.json';
import { inspect } from 'util';
import Emulators from '@secret-agent/emulators';
import Core from '@secret-agent/core';
import Puppet from '@secret-agent/puppet';
import inspectScript from './inspectHierarchy';
import getOverrideScript from '../injected-scripts';

const { chrome, prevProperty } = ChromeJson as any;

let puppet: Puppet;
beforeAll(async () => {
  const emulator = Emulators.create(Core.defaultEmulatorId);
  puppet = new Puppet(emulator);
  Helpers.onClose(() => puppet.close(), true);
  puppet.start();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

const debug = process.env.DEBUG || false;

test('it should mimic a chrome object', async () => {
  const httpServer = await Helpers.runHttpServer();
  const page = await createPage();
  page.on('page-error', console.log);
  if (debug) {
    page.on('console', log => console.log(log));
  }
  await page.addNewDocumentScript(
    getOverrideScript('chrome', {
      polyfill: {
        property: chrome,
        prevProperty,
      },
    }).script,
    false,
  );
  await page.navigate(httpServer.url);

  const structure = JSON.parse(
    (await page.mainFrame.evaluate(`(${inspectScript.toString()})(window, 'window', ['chrome'])`, false)) as any,
  ).window;
  if (debug) console.log(inspect(structure.chrome, false, null, true));
  expect(structure.chrome).toStrictEqual(chrome);
}, 60e3);

test('it should update loadtimes and csi values', async () => {
  const httpServer = await Helpers.runHttpServer();
  const page = await createPage();
  page.on('page-error', console.log);
  if (debug) {
    page.on('console', log => console.log(log));
  }
  await page.addNewDocumentScript(
    getOverrideScript('chrome', {
      updateLoadTimes: true,
      polyfill: {
        property: chrome,
        prevProperty,
      },
    }).script,
    false,
  );
  await page.navigate(httpServer.url);

  const loadTimes = JSON.parse(
    (await page.mainFrame.evaluate(`JSON.stringify(chrome.loadTimes())`, false)) as any,
  );
  if (debug) console.log(inspect(loadTimes, false, null, true));
  expect(loadTimes.requestTime).not.toBe(chrome.loadTimes['new()'].requestTime._value);

  const csi = JSON.parse((await page.mainFrame.evaluate(`JSON.stringify(chrome.csi())`, false)) as any);
  if (debug) console.log(inspect(csi, false, null, true));
  expect(csi.pageT).not.toBe(chrome.csi['new()'].pageT._value);

  expect(csi.onloadT).not.toBe(chrome.csi['new()'].onloadT._value);
  expect(String(csi.onloadT).length).toBe(String(chrome.csi['new()'].onloadT._value).length);
  expect(Object.keys(csi)).toHaveLength(4);
}, 60e3);

async function createPage() {
  const context = await puppet.newContext({
    proxyPassword: '',
    platform: 'win32',
    acceptLanguage: 'en',
    userAgent: 'Chrome Test',
  });
  Helpers.onClose(() => context.close());
  return context.newPage();
}
