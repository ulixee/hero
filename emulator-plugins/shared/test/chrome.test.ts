import * as Helpers from '@secret-agent/testing/helpers';
import ChromeJson from '@secret-agent/emulate-chrome-80/chrome.json';
import { inspect } from 'util';
import ChromeCore from '@secret-agent/core/lib/ChromeCore';
import Emulators from '@secret-agent/emulators';
import Core from '@secret-agent/core';
import inspectScript from './inspectHierarchy';
import getOverrideScript from '../injected-scripts';

const { chrome, prevProperty } = ChromeJson as any;

let chromeCore: ChromeCore;
beforeAll(async () => {
  const emulator = Emulators.create(Core.defaultEmulatorId);
  chromeCore = new ChromeCore(emulator.engineExecutablePath);
  Helpers.onClose(() => chromeCore.close(), true);
  chromeCore.start();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

const debug = process.env.DEBUG || false;

test('it should mimic a chrome object', async () => {
  const httpServer = await Helpers.runHttpServer();
  const page = await createPage();
  page.on('pageError', console.log);
  if (debug) {
    page.on('consoleLog', log => console.log(log));
  }
  await page.frames.addNewDocumentScript(
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
    (await page.evaluate(`(${inspectScript.toString()})(window, 'window')`)) as any,
  ).window;
  if (debug) console.log(inspect(structure.chrome, false, null, true));
  expect(structure.chrome).toStrictEqual(chrome);
}, 60e3);

test('it should update loadtimes and csi values', async () => {
  const httpServer = await Helpers.runHttpServer();
  const page = await createPage();
  page.on('pageError', console.log);
  if (debug) {
    page.on('consoleLog', log => console.log(log));
  }
  await page.frames.addNewDocumentScript(
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

  const loadTimes = JSON.parse((await page.evaluate(`JSON.stringify(chrome.loadTimes())`)) as any);
  if (debug) console.log(inspect(loadTimes, false, null, true));
  expect(loadTimes.requestTime).not.toBe(chrome.loadTimes['new()'].requestTime._value);

  const csi = JSON.parse((await page.evaluate(`JSON.stringify(chrome.csi())`)) as any);
  if (debug) console.log(inspect(csi, false, null, true));
  expect(csi.pageT).not.toBe(chrome.csi['new()'].pageT._value);

  expect(csi.onloadT).not.toBe(chrome.csi['new()'].onloadT._value);
  expect(String(csi.onloadT).length).toBe(String(chrome.csi['new()'].onloadT._value).length);
  expect(Object.keys(csi)).toHaveLength(4);
}, 60e3);

async function createPage() {
  const context = await chromeCore.createContext();
  Helpers.onClose(() => context.close());
  return context.newPage();
}
