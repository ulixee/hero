import * as Helpers from '@secret-agent/testing/helpers';
import { inspect } from 'util';
import * as os from 'os';
import Chrome80 from '@secret-agent/emulate-chrome-80';
import Puppet from '@secret-agent/puppet';
import PolyfillChromeBt from './polyfill.bluetooth.json';
import inspectScript from './inspectHierarchy';
import getOverrideScript from '../injected-scripts';

let puppet: Puppet;
beforeAll(async () => {
  const emulator = new Chrome80();
  puppet = new Puppet(emulator);
  Helpers.onClose(() => puppet.close(), true);
  puppet.start();
});

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

const debug = process.env.DEBUG || false;

test('it should be able to add polyfills', async () => {
  const page = await createPage();
  const httpServer = await Helpers.runHttpServer();
  page.on('pageError', console.log);
  if (debug) {
    page.on('consoleLog', log => console.log(log));
  }

  const objectTestProperties = {
    length: {
      _type: 'number',
      _flags: 'c',
      _value: 0,
    },
    name: {
      _type: 'string',
      _flags: 'c',
      _value: 'ObjectTest',
    },
    arguments: {
      _type: 'object',
      _flags: '',
      _value: null,
    },
    caller: {
      _type: 'object',
      _flags: '',
      _value: null,
    },
    prototype: {
      _protos: ['Object.prototype'],
      creationTime: {
        _flags: 'ce',
        _accessException: 'TypeError: Illegal invocation',
        _get: 'function get creationTime() { [native code] }',
        _getToStringToString: 'function toString() { [native code] }',
      },
      'Symbol(Symbol.toStringTag)': {
        _type: 'string',
        _flags: 'c',
        _value: 'ObjectTest',
      },
      _type: 'object',
      _flags: '',
    },
    'new()': 'TypeError: Illegal constructor',
    _function: 'function ObjectTest() { [native code] }',
    _flags: 'cw',
  };
  const chromeProperty = {
    _flags: 'ce',
    _type: 'string',
    _value: 'I am chrome',
  };
  await page.addNewDocumentScript(
    getOverrideScript('polyfill', {
      additions: [
        {
          path: 'window',
          propertyName: 'chrome',
          prevProperty: 'Atomics',
          property: chromeProperty,
        },
        {
          path: 'window',
          propertyName: 'ObjectTest',
          prevProperty: 'chrome',
          property: objectTestProperties,
        },
      ],
      removals: [],
      changes: [],
      order: [],
    }).script,
    false,
  );
  await page.navigate(httpServer.url);
  await new Promise(resolve => page.once('load', resolve));

  const { window } = JSON.parse(
    (await page.mainFrame.run(`(${inspectScript.toString()})(window, 'window')`, false)) as any,
  );

  const windowKeys = Object.keys(window);
  // test chrome property
  if (debug) {
    console.log('chrome', inspect(window.chrome, false, null, true));
  }
  expect(window.chrome).toStrictEqual(chromeProperty);
  expect(windowKeys.indexOf('chrome')).toBe(windowKeys.indexOf('Atomics') + 1);

  // test ObjectTest property
  if (debug) {
    console.log('ObjectTest', inspect(window.ObjectTest, false, null, true));
  }
  expect(window.ObjectTest).toStrictEqual(objectTestProperties);
  expect(windowKeys.indexOf('ObjectTest')).toBe(windowKeys.indexOf('chrome') + 1);
});

test('it should be able to remove properties', async () => {
  const page = await createPage();
  const httpServer = await Helpers.runHttpServer();

  await page.addNewDocumentScript(
    getOverrideScript('polyfill', {
      additions: [],
      removals: ['window.Atomics', 'window.Array.from'],
      changes: [],
      order: [],
    }).script,
    false,
  );
  await page.navigate(httpServer.url);
  await new Promise(resolve => page.once('load', resolve));

  expect(await page.mainFrame.run(`!!window.Atomics`, false)).not.toBeTruthy();
  expect(await page.mainFrame.run(`!!Array.from`, false)).not.toBeTruthy();
});

test('it should be able to change properties', async () => {
  const page = await createPage();
  const httpServer = await Helpers.runHttpServer();

  await page.addNewDocumentScript(
    getOverrideScript('polyfill', {
      additions: [],
      removals: [],
      changes: [
        {
          path: 'window.Navigator.prototype.registerProtocolHandler.name',
          propertyName: '_value',
          property: 'notTheRightName',
        },
        {
          path: 'window.Navigator.prototype.registerProtocolHandler',
          propertyName: '_function',
          property: 'function registerProtocolHandler() { [unnative code] }',
        },
      ],
      order: [],
    }).script,
    false,
  );
  await page.navigate(httpServer.url);
  await new Promise(resolve => page.once('load', resolve));

  const protocolToString = await page.mainFrame.run(
    `window.Navigator.prototype.registerProtocolHandler.toString()`,
    false,
  );
  const protocolName = await page.mainFrame.run(
    `window.Navigator.prototype.registerProtocolHandler.name`,
    false,
  );

  expect(protocolName).toBe('notTheRightName');
  expect(protocolToString).toBe('function registerProtocolHandler() { [unnative code] }');
});

test('it should be able to change property order', async () => {
  const httpServer = await Helpers.runHttpServer();
  const page = await createPage();

  const startNavigatorKeys = (await page.mainFrame.run(
    `Object.keys(window.Navigator.prototype)`,
    false,
  )) as string[];

  await page.addNewDocumentScript(
    getOverrideScript('polyfill', {
      removals: [],
      additions: [],
      changes: [],
      order: [
        {
          path: 'window.Navigator.prototype',
          propertyName: startNavigatorKeys[10],
          throughProperty: startNavigatorKeys[12],
          prevProperty: startNavigatorKeys[1],
        },
        {
          path: 'window.Navigator.prototype',
          propertyName: startNavigatorKeys[18],
          throughProperty: startNavigatorKeys[18],
          prevProperty: startNavigatorKeys[12],
        },
      ],
    }).script,
    false,
  );
  await new Promise(setImmediate);
  await page.navigate(httpServer.url);
  await new Promise(resolve => page.once('load', resolve));

  const keyOrder = (await page.mainFrame.run(
    `Object.keys(window.Navigator.prototype)`,
    false,
  )) as string[];

  const prop1Index = keyOrder.indexOf(startNavigatorKeys[10]);
  expect(keyOrder[prop1Index - 1]).toBe(startNavigatorKeys[1]);

  const prop2Index = keyOrder.indexOf(startNavigatorKeys[18]);
  expect(keyOrder[prop2Index - 1]).toBe(startNavigatorKeys[12]);
});

test('it should be able to change window property order', async () => {
  const httpServer = await Helpers.runHttpServer();
  const page = await createPage();
  const windowKeys = await page.mainFrame.run(`Object.keys(window)`, false);

  const order = [
    {
      path: 'window',
      propertyName: windowKeys[10],
      throughProperty: windowKeys[12],
      prevProperty: windowKeys[1],
    },
    {
      path: 'window',
      propertyName: windowKeys[18],
      throughProperty: windowKeys[18],
      prevProperty: windowKeys[12],
    },
    {
      path: 'window',
      propertyName: windowKeys[25],
      throughProperty: windowKeys[50],
      prevProperty: windowKeys[23],
    },
  ];
  await page.addNewDocumentScript(
    getOverrideScript('polyfill', {
      removals: [],
      additions: [],
      changes: [],
      order,
    }).script,
    false,
  );
  await page.navigate(httpServer.url);
  await new Promise(resolve => page.once('load', resolve));

  const windowKeysAfter = (await page.mainFrame.run(`Object.keys(window)`, false)) as string[];

  const prop1Index = windowKeysAfter.indexOf(windowKeys[10]);
  expect(windowKeysAfter[prop1Index - 1]).toBe(windowKeys[1]);

  const prop2Index = windowKeysAfter.indexOf(windowKeys[18]);
  expect(windowKeysAfter[prop2Index - 1]).toBe(windowKeys[12]);

  const prop3Index = windowKeysAfter.indexOf(windowKeys[25]);
  expect(windowKeysAfter[prop3Index - 1]).toBe(windowKeys[23]);

  expect(windowKeysAfter.indexOf(windowKeys[26])).toBe(prop3Index + 1);
  expect(windowKeysAfter.indexOf(windowKeys[50])).toBe(prop3Index + 25);
}, 10e3);

test('it should be able to backfill the bluetooth stack', async () => {
  const platform = os.platform();
  const isPlatformSupported = platform === 'darwin' || platform === 'win32';
  if (!isPlatformSupported) return;

  const httpServer = await Helpers.runHttpServer();
  const page = await createPage();

  await page.addNewDocumentScript(getOverrideScript('polyfill', PolyfillChromeBt).script, false);
  await page.navigate(httpServer.url);
  await new Promise(resolve => page.once('load', resolve));

  const structure = JSON.parse(
    (await page.mainFrame.run(`(${inspectScript.toString()})(window, 'window')`, false)) as any,
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

async function createPage() {
  const context = await puppet.newContext({
    proxyPassword: '',
    platform: 'win32',
    acceptLanguage: 'en',
    userAgent: 'Chrome Test',
  });
  Helpers.onClose(() => context.close());
  const page = await context.newPage();
  page.on('pageError', console.log);
  if (debug) {
    page.on('consoleLog', log => console.log(log));
  }
  return page;
}
