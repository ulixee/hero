import * as Helpers from '@secret-agent/testing/helpers';
import { inspect } from 'util';
import Puppet from '@secret-agent/puppet';
import Core from '@secret-agent/core';
import Emulators from '@secret-agent/emulators';
import inspectHierarchy from './inspectHierarchy';
import { proxyFunction } from '../injected-scripts/utils';
import getOverrideScript from '../injected-scripts';

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

  const heirarchy = JSON.parse(await inspectHierarchy(win, 'win')).window;
  if (debug) console.log(inspect(heirarchy, false, null, true));
  expect(win.holder.tester.doSomeWork('we')).toBe('we nope');

  proxyFunction(win.TestClass.prototype, 'doSomeWork', (target, thisArg, args) => {
    return `${target.call(thisArg, args)} yep`;
  });

  const afterHierarchy = JSON.parse(await inspectHierarchy(win, 'win')).window;
  if (debug) console.log(inspect(afterHierarchy, false, null, true));

  expect(win.holder.tester.doSomeWork('oh')).toBe('oh nope yep');
  expect(afterHierarchy.TestClass.prototype.doSomeWork._invocation).toBe('undefined nope yep');
  // these 2 will now be different in the structure
  delete heirarchy.TestClass.prototype.doSomeWork._invocation;
  delete afterHierarchy.TestClass.prototype.doSomeWork._invocation;
  expect(heirarchy).toStrictEqual(afterHierarchy);
});

test('should override a function and clean error stacks', async () => {
  const httpServer = await Helpers.runHttpServer();

  const context = await puppet.newContext({
    proxyPassword: '',
    platform: 'win32',
    acceptLanguage: 'en',
    userAgent: 'Plugin Test',
  });
  Helpers.onClose(() => context.close());
  const page = await context.newPage();

  page.on('page-error', console.log);
  if (debug) {
    page.on('console', log => console.log(log));
  }
  await page.addNewDocumentScript(
    getOverrideScript('navigator', {
      platform: 'win32',
      memory: '4gb',
    }).script,
    false,
  );
  await page.navigate(httpServer.url);

  const worksOnce = await page.evaluate(`navigator.permissions.query({ name: 'geolocation' }).then(x => x.state)`);
  expect(worksOnce).toBeTruthy();

  const perms = await page.evaluate(`(async () => {
    try {
      await navigator.permissions.query()
    } catch(err) {
      return err.stack;
    }
  })();`);
  expect(perms).not.toContain('__secretagent_bootscript__');
});
