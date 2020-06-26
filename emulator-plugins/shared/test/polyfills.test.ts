import puppeteer from 'puppeteer';
import * as Helpers from '@secret-agent/shared-testing/helpers';
import getOverrideScript from '../injected-scripts';
import inspectScript from './inspectHierarchy';
import PolyfillChrome from './polyfill.json';
import PolyfillChromeBt from './polyfill.bluetooth.json';
import { inspect } from 'util';

afterEach(() => Helpers.closeAll());

const debug = process.env.DEBUG || false;

test('it should be able to add polyfills', async () => {
  const polyfills = PolyfillChrome as any;
  const puppBrowser = await puppeteer.launch({ headless: true, devtools: true });
  Helpers.onClose(() => puppBrowser.close());
  const httpServer = await Helpers.runHttpServer();
  const page = await puppBrowser.newPage();
  page.on('pageerror', console.log);
  if (debug) {
    page.on('console', log => console.log(log.text()));
  }

  await page.evaluateOnNewDocument(getOverrideScript('polyfill', polyfills).script);
  await page.goto(httpServer.url);

  const structure = JSON.parse(
    (await page.evaluate(`(${inspectScript.toString()})(window, 'window')`)) as any,
  );

  function getFromStructure(path) {
    const pathSplit = path.split('.');
    let entry = structure;
    for (const split of pathSplit) {
      if (split) {
        entry = entry[split];
      }
    }
    return entry;
  }

  for (const polyfill of polyfills.additions) {
    const parent = getFromStructure(polyfill.path);

    if (debug) {
      console.log(polyfill.propertyName, inspect(parent[polyfill.propertyName], false, null, true));
    }
    expect(parent[polyfill.propertyName]).toStrictEqual(polyfill.property);
    const keys = Object.keys(parent);
    expect(keys.indexOf(polyfill.propertyName)).toBe(keys.indexOf(polyfill.prevProperty) + 1);
  }

  for (const removal of polyfills.removals) {
    const parentPath = removal.split('.');
    const prop = parentPath.pop();
    const parent = getFromStructure(parentPath.join('.'));
    expect(parent).not.toHaveProperty(prop);
  }

  const func = structure.window.Navigator.prototype.registerProtocolHandler;
  expect(func.name._value).toBe('registerProtocolHandler');
  expect(func._function).toBe('function registerProtocolHandler() { [native code] }');

  expect(Object.keys(structure.window.Navigator.prototype)).toStrictEqual([
    '_protos',
    'vendorSub',
    'productSub',
    'vendor',
    'maxTouchPoints',
    'hardwareConcurrency',
    'cookieEnabled',
    'appCodeName',
    'appName',
    'appVersion',
    'platform',
    'product',
    'userAgent',
    'language',
    'languages',
    'onLine',
    'doNotTrack',
    'geolocation',
    'mediaCapabilities',
    'connection',
    'plugins',
    'mimeTypes',
    'webkitTemporaryStorage',
    'webkitPersistentStorage',
    'getBattery',
    'sendBeacon',
    'getGamepads',
    'javaEnabled',
    'vibrate',
    'webdriver',
    'userActivation',
    'mediaSession',
    'permissions',
    'registerProtocolHandler',
    'unregisterProtocolHandler',
    'deviceMemory',
    'clipboard',
    'credentials',
    'keyboard',
    'locks',
    'mediaDevices',
    'serviceWorker',
    'storage',
    'presentation',
    // 'bluetooth', this gets deleted
    'usb',
    'xr',
    'requestMediaKeySystemAccess',
    'getUserMedia',
    'webkitGetUserMedia',
    'requestMIDIAccess',
    'Symbol(Symbol.toStringTag)',
    '_type',
    '_flags',
  ]);
  for (const order of polyfills.order) {
    const keyOrder = Object.keys(getFromStructure(order.path)).filter(x => x[0] !== '_');
    const index = keyOrder.indexOf(order.propertyName);
    if (!order.prevProperty) expect(index).toBe(0);
    else expect(keyOrder[index - 1]).toBe(order.prevProperty);
  }
}, 60e3);

test('it should be able to change prototype properties', async () => {
  const puppBrowser = await puppeteer.launch({ headless: true, devtools: true });
  Helpers.onClose(() => puppBrowser.close());
  const httpServer = await Helpers.runHttpServer();
  const page = await puppBrowser.newPage();
  page.on('pageerror', console.log);
  if (debug) {
    page.on('console', log => console.log(log.text()));
  }

  await page.evaluateOnNewDocument(
    getOverrideScript('polyfill', {
      removals: [],
      additions: [],
      changes: [],
      order: [
        {
          path: 'window.Navigator.prototype',
          propertyName: 'registerProtocolHandler',
          throughProperty: 'unregisterProtocolHandler',
          prevProperty: 'permissions',
        },
        {
          path: 'window.Navigator.prototype',
          propertyName: 'deviceMemory',
          throughProperty: 'webkitGetUserMedia',
          prevProperty: 'unregisterProtocolHandler',
        },
      ],
    }).script,
  );
  await page.goto(httpServer.url);

  const structure = JSON.parse(
    (await page.evaluate(
      `(${inspectScript.toString()})(window.Navigator.prototype, 'window.Navigator.prototype')`,
    )) as any,
  ).window;

  const keyOrder = Object.keys(structure).filter(x => x[0] !== '_');
  {
    const index = keyOrder.indexOf('registerProtocolHandler');
    expect(keyOrder[index - 1]).toBe('permissions');
  }
  {
    const index = keyOrder.indexOf('deviceMemory');
    expect(keyOrder[index - 1]).toBe('unregisterProtocolHandler');
  }
});

test('it should be able to change own properties', async () => {
  const puppBrowser = await puppeteer.launch({ headless: true, devtools: true });
  Helpers.onClose(() => puppBrowser.close());
  const httpServer = await Helpers.runHttpServer();
  const page = await puppBrowser.newPage();
  page.on('pageerror', console.log);
  if (debug) {
    page.on('console', log => console.log(log.text()));
  }
  const order = [
    {
      path: 'window',
      propertyName: 'Element',
      throughProperty: 'CustomElementRegistry',
      prevProperty: 'ErrorEvent',
    },
    {
      path: 'window',
      propertyName: 'ByteLengthQueuingStrategy',
      throughProperty: 'ByteLengthQueuingStrategy',
      prevProperty: 'isNaN',
    },
    {
      path: 'window',
      propertyName: 'onformdata',
      throughProperty: 'onformdata',
      prevProperty: 'XSLTProcessor',
    },
    {
      path: 'window',
      propertyName: 'ontransitionend',
      throughProperty: 'ontransitionend',
      prevProperty: 'onsearch',
    },
    {
      path: 'window',
      propertyName: 'onafterprint',
      throughProperty: 'createImageBitmap',
      prevProperty: 'onselectionchange',
    },
  ];
  await page.evaluateOnNewDocument(
    getOverrideScript('polyfill', {
      removals: [],
      additions: [],
      changes: [],
      order,
    }).script,
  );
  await page.goto(httpServer.url);

  const structure = JSON.parse(
    (await page.evaluate(`(${inspectScript.toString()})(window, 'window')`)) as any,
  ).window;

  const keyOrder = Object.keys(structure).filter(x => x[0] !== '_');
  for (const entry of order) {
    const index = keyOrder.indexOf(entry.propertyName);
    expect(keyOrder[index - 1]).toBe(entry.prevProperty);
  }
}, 10e3);

test('it should be able to backfill the bluetooth stack', async () => {
  const puppBrowser = await puppeteer.launch({ headless: true, devtools: true });
  Helpers.onClose(() => puppBrowser.close());
  const httpServer = await Helpers.runHttpServer();
  const page = await puppBrowser.newPage();
  page.on('pageerror', console.log);
  if (debug) {
    page.on('console', log => console.log(log.text()));
  }

  await page.evaluateOnNewDocument(getOverrideScript('polyfill', PolyfillChromeBt).script);
  await page.goto(httpServer.url);

  const structure = JSON.parse(
    (await page.evaluate(`(${inspectScript.toString()})(window, 'window')`)) as any,
  );

  function getFromStructure(path) {
    const pathSplit = path.split('.');
    let entry = structure;
    for (const split of pathSplit) {
      if (split) {
        entry = entry[split];
      }
    }
    return entry;
  }

  for (const polyfill of PolyfillChromeBt.additions) {
    const parent = getFromStructure(polyfill.path);

    if (debug) {
      console.log(
        `${polyfill.path}.${polyfill.propertyName}`,
        inspect(parent ? parent[polyfill.propertyName] : 'parent null', false, null, true),
      );
    }
    const keys = Object.keys(parent);
    expect(keys.indexOf(polyfill.propertyName)).toBe(keys.indexOf(polyfill.prevProperty) + 1);
  }

  for (const polyfill of PolyfillChromeBt.additions) {
    const parent = getFromStructure(polyfill.path);
    expect(parent[polyfill.propertyName]).toStrictEqual(polyfill.property);
    if (debug) {
      console.log('Matched structure', polyfill.path, polyfill.propertyName);
    }
  }
});
