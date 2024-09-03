import * as Helpers from '@ulixee/unblocked-agent-testing/helpers';
import { inspect } from 'util';
import Log from '@ulixee/commons/lib/Logger';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { Browser } from '@ulixee/unblocked-agent';
import { defaultHooks } from '@ulixee/unblocked-agent-testing/browserUtils';
import { getOverrideScript, injectedSourceUrl } from '../lib/DomOverridesBuilder';
// @ts-ignore
// eslint-disable-next-line import/extensions
import { replaceFunction } from '../injected-scripts/_proxyUtils';
import BrowserEmulator from '../index';
import DomExtractor = require('./DomExtractor');
import { InjectedScript } from '../interfaces/IBrowserEmulatorConfig';

const { log } = Log(module);
const selectBrowserMeta = BrowserEmulator.selectBrowserMeta();

let browser: Browser;
beforeEach(Helpers.beforeEach);
beforeAll(async () => {
  browser = new Browser(selectBrowserMeta.browserEngine, defaultHooks);
  Helpers.onClose(() => browser.close(), true);
  await browser.launch();
});

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

const debug = process.env.DEBUG || false;

test('should be able to override a function', async () => {
  class TestClass {
    public doSomeWork(param: string) {
      return `${param} nope`;
    }
  }
  const holder = {
    tester: new TestClass(),
  };
  const win = {
    TestClass,
    holder,
  };

  // @ts-ignore
  global.self = this;
  const hierarchy = JSON.parse(await new DomExtractor('window').run(win, 'win')).window;
  if (debug) console.log(inspect(hierarchy, false, null, true));
  expect(win.holder.tester.doSomeWork('we')).toBe('we nope');

  replaceFunction(win.TestClass.prototype, 'doSomeWork', (target, thisArg, args) => {
    return `${target.apply(thisArg, args)} yep`;
  });

  const afterHierarchy = JSON.parse(await new DomExtractor('window').run(win, 'win')).window;
  if (debug) console.log(inspect(afterHierarchy, false, null, true));

  expect(win.holder.tester.doSomeWork('oh')).toBe('oh nope yep');
  expect(afterHierarchy.TestClass.prototype.doSomeWork._$invocation).toBe('undefined nope yep');
  // these 2 will now be different in the structure
  delete hierarchy.TestClass.prototype.doSomeWork._$invocation;
  delete afterHierarchy.TestClass.prototype.doSomeWork._$invocation;
  expect(hierarchy).toStrictEqual(afterHierarchy);
});

test('should override a function and clean error stacks', async () => {
  const httpServer = await Helpers.runHttpServer();
  const context = await browser.newContext({ logger: log as IBoundLog });
  Helpers.onClose(() => context.close());
  const page = await context.newPage();

  page.on('page-error', console.log);
  if (debug) {
    page.on('console', console.log);
  }
  await page.addNewDocumentScript(
    getOverrideScript(InjectedScript.NAVIGATOR_DEVICE_MEMORY, {
      memory: '4gb',
    }).script,
    false,
  );
  await Promise.all([
    page.navigate(httpServer.baseUrl),
    page.mainFrame.waitOn('frame-lifecycle', ev => ev.name === 'DOMContentLoaded'),
  ]);

  const worksOnce = await page.evaluate(
    `navigator.permissions.query({ name: 'geolocation' }).then(x => x.state)`,
  );
  expect(worksOnce).toBeTruthy();

  const perms = await page.evaluate(`(async () => {
    try {
      await navigator.permissions.query()
    } catch(err) {
      return err.stack;
    }
  })();`);
  expect(perms).not.toContain(injectedSourceUrl);
});

test('should be able to combine multiple single instance overrides', async () => {
  class TestClass {
    public doSomeWork(param: string) {
      return `${param} nope`;
    }
  }

  const a = new TestClass();
  const b = new TestClass();
  const c = new TestClass();

  replaceFunction(TestClass.prototype, 'doSomeWork', () => 'base');
  replaceFunction(a, 'doSomeWork', t => 'a', { onlyForInstance: true });
  replaceFunction(b, 'doSomeWork', () => 'b', { onlyForInstance: true });

  expect(a.doSomeWork('')).toBe('a');
  expect(b.doSomeWork('')).toBe('b');
  expect(c.doSomeWork('')).toBe('base');
  expect(a.doSomeWork === b.doSomeWork && b.doSomeWork === c.doSomeWork).toBeTruthy();
});
