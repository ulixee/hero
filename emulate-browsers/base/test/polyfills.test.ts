import * as Helpers from '@secret-agent/testing/helpers';
import { ITestHttpServer } from '@secret-agent/testing/helpers';
import { inspect } from 'util';
import Puppet from '@secret-agent/puppet';
import IPuppetContext from '@secret-agent/core-interfaces/IPuppetContext';
import { GlobalPool, BrowserEmulators } from '@secret-agent/core';
import Log from '@secret-agent/commons/Logger';
import * as http from 'http';
import { getOverrideScript } from '../lib/DomOverridesBuilder';
import DomExtractor = require('./DomExtractor');

const { log } = Log(module);

let puppet: Puppet;
let httpServer: ITestHttpServer<http.Server>;
let context: IPuppetContext;
beforeAll(async () => {
  const engine = BrowserEmulators.getClassById(GlobalPool.defaultBrowserEmulatorId).engine;
  puppet = new Puppet(engine);
  Helpers.onClose(() => puppet.close(), true);
  puppet.start();

  context = await puppet.newContext(
    {
      canPolyfill: false,
      configuration: { locale: 'en' },
      sessionId: '',
      configure(): Promise<void> {
        return null;
      },
      osPlatform: 'win32',
      userAgentString: 'Plugin Test',
      async onNewPuppetPage() {
        return null;
      },
    },
    log,
  );
  Helpers.onClose(() => context.close().catch(), true);
  httpServer = await Helpers.runHttpServer({ onlyCloseOnFinal: true });
});

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

const debug = process.env.DEBUG || false;

test('it should be able to add polyfills', async () => {
  const page = await createPage();

  const objectTestProperties = {
    length: {
      _$type: 'number',
      _$flags: 'c',
      _$value: 0,
    },
    name: {
      _$type: 'string',
      _$flags: 'c',
      _$value: 'ObjectTest',
    },
    arguments: {
      _$type: 'object',
      _$flags: '',
      _$value: null,
    },
    caller: {
      _$type: 'object',
      _$flags: '',
      _$value: null,
    },
    prototype: {
      _$protos: ['Object.prototype'],
      creationTime: {
        _$flags: 'ce',
        _$accessException: 'TypeError: Illegal invocation',
        _$get: 'function get creationTime() { [native code] }',
        _$getToStringToString: 'function toString() { [native code] }',
      },
      'Symbol(Symbol.toStringTag)': {
        _$type: 'string',
        _$flags: 'c',
        _$value: 'ObjectTest',
      },
      _$type: 'object',
      _$flags: '',
    },
    'new()': {
      _$constructorException: "TypeError: Cannot read property '0' of undefined",
      _$type: 'constructor',
    },
    _$type: 'function',
    _$function: 'function ObjectTest() { [native code] }',
    _$flags: 'cw',
    _$value: 'function ObjectTest() { [native code] }',
    _$invocation: "TypeError: Cannot read property '0' of undefined",
  };
  const chromeProperty = {
    _$flags: 'ce',
    _$type: 'string',
    _$value: 'I am chrome',
  };
  await page.addNewDocumentScript(
    getOverrideScript('polyfill.add', {
      itemsToAdd: [
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
    }).script,
    false,
  );
  await Promise.all([
    page.navigate(httpServer.url),
    page.mainFrame.waitOn('frame-lifecycle', event => event.name === 'load'),
  ]);

  const json = await page.mainFrame.evaluate(
    `new (${DomExtractor.toString()})('window').run(window, 'window', ['windowKeys','chromey','ObjectTest'])`,
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
    getOverrideScript('polyfill.remove', {
      itemsToRemove: [
        { path: 'window', propertyName: 'Atomics' },
        { path: 'window.Array', propertyName: 'from' },
      ],
    }).script,
    false,
  );
  await Promise.all([
    page.navigate(httpServer.url),
    page.mainFrame.waitOn('frame-lifecycle', event => event.name === 'load'),
  ]);

  expect(await page.mainFrame.evaluate(`!!window.Atomics`, false)).not.toBeTruthy();
  expect(await page.mainFrame.evaluate(`!!Array.from`, false)).not.toBeTruthy();
});

test('it should be able to change properties', async () => {
  const page = await createPage();

  await page.addNewDocumentScript(
    getOverrideScript('polyfill.modify', {
      itemsToModify: [
        {
          path: 'window.Navigator.prototype.registerProtocolHandler.name',
          propertyName: '_$value',
          property: 'notTheRightName',
        },
        {
          path: 'window.Navigator.prototype.registerProtocolHandler',
          propertyName: '_$function',
          property: 'function registerProtocolHandler() { [unnative code] }',
        },
      ],
    }).script,
    false,
  );
  await Promise.all([
    page.navigate(httpServer.url),
    page.mainFrame.waitOn('frame-lifecycle', event => event.name === 'load'),
  ]);

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
    getOverrideScript('polyfill.reorder', {
      itemsToReorder: [
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
  await Promise.all([
    page.navigate(httpServer.url),
    page.mainFrame.waitOn('frame-lifecycle', event => event.name === 'load'),
  ]);

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

  const itemsToReorder = [
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
    getOverrideScript('polyfill.reorder', {
      itemsToReorder,
    }).script,
    false,
  );
  await Promise.all([
    page.navigate(httpServer.url),
    page.mainFrame.waitOn('frame-lifecycle', event => event.name === 'load'),
  ]);
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
    page.on('console', console.log);
  }
  return page;
}
