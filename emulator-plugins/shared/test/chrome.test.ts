import puppeteer from 'puppeteer';
import * as Helpers from '@secret-agent/testing/helpers';
import getOverrideScript from '../injected-scripts';
import inspectScript from './inspectHierarchy';
import ChromeJson from '../../emulate-chrome-80/chrome.json';
import { inspect } from 'util';

const { chrome, prevProperty } = ChromeJson as any;

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

const debug = process.env.DEBUG || false;

test('it should mimic a chrome object', async () => {
  const puppBrowser = await puppeteer.launch({ headless: true, devtools: true });
  Helpers.onClose(() => puppBrowser.close());
  const httpServer = await Helpers.runHttpServer();
  const page = await puppBrowser.newPage();
  page.on('pageerror', console.log);
  if (debug) {
    page.on('console', log => console.log(log.text()));
  }
  await page.evaluateOnNewDocument(
    getOverrideScript('chrome', {
      polyfill: {
        property: chrome,
        prevProperty,
      },
    }).script,
  );
  await page.goto(httpServer.url);

  const structure = JSON.parse(
    (await page.evaluate(`(${inspectScript.toString()})(window, 'window')`)) as any,
  ).window;
  if (debug) console.log(inspect(structure.chrome, false, null, true));
  expect(structure.chrome).toStrictEqual(chrome);
}, 60e3);

test('it should update loadtimes and csi values', async () => {
  const puppBrowser = await puppeteer.launch({ headless: true, devtools: true });
  Helpers.onClose(() => puppBrowser.close());
  const httpServer = await Helpers.runHttpServer();
  const page = await puppBrowser.newPage();
  page.on('pageerror', console.log);
  if (debug) {
    page.on('console', log => console.log(log.text()));
  }
  await page.evaluateOnNewDocument(
    getOverrideScript('chrome', {
      updateLoadTimes: true,
      polyfill: {
        property: chrome,
        prevProperty,
      },
    }).script,
  );
  await page.goto(httpServer.url);

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
