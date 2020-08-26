import { inspect } from 'util';
import inspectHierarchy from './inspectHierarchy';
import { proxyFunction } from '../injected-scripts/utils';

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
