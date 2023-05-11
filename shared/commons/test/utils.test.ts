import * as Utils from '../lib/utils';
import { bindFunctions } from '../lib/utils';
import { isSemverSatisfied } from '../lib/VersionUtils';

const { escapeUnescapedChar } = Utils;

test('should escape unescaped regex chars', () => {
  const result = escapeUnescapedChar('http://test.com?param=1', '?');
  expect(result).toBe('http://test.com\\?param=1');
});

test('should not escape already unescaped regex chars', () => {
  const result = escapeUnescapedChar('http://test.com\\?param=1', '?');
  expect(result).toBe('http://test.com\\?param=1');
});

test('should get all functions of an object hierarchy', () => {
  class BaseClass {
    method1() {}
    method2() {}
  }

  class TestClass extends BaseClass {
    method3() {}
  }

  const instance = new TestClass();
  const hierarchy = Utils.getPrototypeHierarchy(instance);
  expect(hierarchy[0]).toEqual(BaseClass.prototype);
  expect(hierarchy[1]).toEqual(TestClass.prototype);
  expect(hierarchy[2]).toEqual(instance);
  // cache should return the same set
  expect(Utils.getPrototypeHierarchy(instance)).toEqual(hierarchy);

  bindFunctions(instance);

  expect([...Utils.getObjectFunctionProperties(BaseClass.prototype)]).toEqual([
    'method1',
    'method2',
  ]);
  expect([...Utils.getObjectFunctionProperties(TestClass.prototype)]).toEqual(['method3']);

  // should bind all methods
  expect([...Utils.getObjectFunctionProperties(instance)]).toEqual([
    'method1',
    'method2',
    'method3',
  ]);
});

test('can check Prerelease Semvers', () => {
  expect(isSemverSatisfied('2.0.0-alpha.1', '2.0.0-alpha.1')).toBeTruthy();
  expect(isSemverSatisfied('2.0.0-alpha.1', '2.0.0-alpha.2')).toBeTruthy();
});

test('can handle v in front of versions', () => {
  expect(isSemverSatisfied('v2.0.0-alpha.1', '2.0.0-alpha.1')).toBeTruthy();
});
