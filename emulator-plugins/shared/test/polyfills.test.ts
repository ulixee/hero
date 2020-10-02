import * as Helpers from '@secret-agent/testing/helpers';
import { ITestHttpServer } from '@secret-agent/testing/helpers';
import { inspect } from 'util';
import Puppet from '@secret-agent/puppet';
import IPuppetContext from '@secret-agent/puppet/interfaces/IPuppetContext';
import Emulators from '@secret-agent/emulators';
import Core from '@secret-agent/core';
import inspectScript from './inspectHierarchy';
import { getOverrideScript } from '../injected-scripts';

let puppet: Puppet;
let httpServer: ITestHttpServer;
let context: IPuppetContext;
beforeAll(async () => {
  const emulator = Emulators.create(Core.defaultEmulatorId);
  puppet = new Puppet(emulator);
  Helpers.onClose(() => puppet.close(), true);
  puppet.start();

  context = await puppet.newContext({
    proxyPassword: '',
    platform: 'win32',
    acceptLanguage: 'en',
    userAgent: 'Chrome Test',
  });
  Helpers.onClose(() => context.close().catch(), true);
  httpServer = await Helpers.runHttpServer({ onlyCloseOnFinal: true });
});

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

const debug = process.env.DEBUG || false;

test('it should be able to add polyfills', async () => {
  const page = await createPage();
  page.on('page-error', console.log);
  if (debug) {
    page.on('console', log => console.log(log));
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
          propertyName: 'chromey',
          prevProperty: 'Atomics',
          property: chromeProperty,
        },
        {
          path: 'window',
          propertyName: 'ObjectTest',
          prevProperty: 'chromey',
          property: objectTestProperties,
        },
      ],
      removals: [],
      changes: [],
      order: [],
    }).script,
    false,
  );
  await Promise.all([page.navigate(httpServer.url), page.waitOn('load')]);

  const json = await page.mainFrame.evaluate(
    `(${inspectScript.toString()})(window, 'window', ['windowKeys','chromey','ObjectTest'])`,
    false,
  );
  const result = JSON.parse(json as any);

  const windowKeys = result.windowKeys;
  const window = result.window;
  // test chrome property
  if (debug) {
    console.log('chromey', inspect(window.chromey, false, null, true));
  }
  expect(window.chromey).toStrictEqual(chromeProperty);
  expect(windowKeys.indexOf('chromey')).toBe(windowKeys.indexOf('Atomics') + 1);

  // test ObjectTest property
  if (debug) {
    console.log('ObjectTest', inspect(window.ObjectTest, false, null, true));
  }
  expect(window.ObjectTest).toStrictEqual(objectTestProperties);
  expect(windowKeys.indexOf('ObjectTest')).toBe(windowKeys.indexOf('chromey') + 1);
}, 60e3);

test('it should be able to remove properties', async () => {
  const page = await createPage();

  await page.addNewDocumentScript(
    getOverrideScript('polyfill', {
      additions: [],
      removals: ['window.Atomics', 'window.Array.from'],
      changes: [],
      order: [],
    }).script,
    false,
  );
  await Promise.all([page.navigate(httpServer.url), page.waitOn('load')]);

  expect(await page.mainFrame.evaluate(`!!window.Atomics`, false)).not.toBeTruthy();
  expect(await page.mainFrame.evaluate(`!!Array.from`, false)).not.toBeTruthy();
});

test('it should be able to change properties', async () => {
  const page = await createPage();

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
  await Promise.all([page.navigate(httpServer.url), page.waitOn('load')]);

  const protocolToString = await page.mainFrame.evaluate(
    `window.Navigator.prototype.registerProtocolHandler.toString()`,
    false,
  );
  const protocolName = await page.mainFrame.evaluate(
    `window.Navigator.prototype.registerProtocolHandler.name`,
    false,
  );

  expect(protocolName).toBe('notTheRightName');
  expect(protocolToString).toBe('function registerProtocolHandler() { [unnative code] }');
});

test('it should be able to change property order', async () => {
  const page = await createPage();

  const startNavigatorKeys = (await page.mainFrame.evaluate(
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
  await Promise.all([page.navigate(httpServer.url), page.waitOn('load')]);

  const keyOrder = (await page.mainFrame.evaluate(
    `Object.keys(window.Navigator.prototype)`,
    false,
  )) as string[];

  const prop1Index = keyOrder.indexOf(startNavigatorKeys[10]);
  expect(keyOrder[prop1Index - 1]).toBe(startNavigatorKeys[1]);

  const prop2Index = keyOrder.indexOf(startNavigatorKeys[18]);
  expect(keyOrder[prop2Index - 1]).toBe(startNavigatorKeys[12]);
});

test('it should be able to change window property order', async () => {
  const page = await createPage();
  const windowKeys = await page.mainFrame.evaluate(`Object.keys(window)`, false);

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
  await Promise.all([page.navigate(httpServer.url), page.waitOn('load')]);
  const windowKeysAfter = (await page.mainFrame.evaluate(`Object.keys(window)`, false)) as string[];

  const prop1Index = windowKeysAfter.indexOf(windowKeys[10]);
  expect(windowKeysAfter[prop1Index - 1]).toBe(windowKeys[1]);

  const prop2Index = windowKeysAfter.indexOf(windowKeys[18]);
  expect(windowKeysAfter[prop2Index - 1]).toBe(windowKeys[12]);

  const prop3Index = windowKeysAfter.indexOf(windowKeys[25]);
  expect(windowKeysAfter[prop3Index - 1]).toBe(windowKeys[23]);

  expect(windowKeysAfter.indexOf(windowKeys[26])).toBe(prop3Index + 1);
  expect(windowKeysAfter.indexOf(windowKeys[50])).toBe(prop3Index + 25);
}, 10e3);

async function createPage() {
  const page = await context.newPage();
  Helpers.onClose(() => page.close());
  page.on('page-error', console.log);
  if (debug) {
    page.on('console', log => console.log(log));
  }
  return page;
}
