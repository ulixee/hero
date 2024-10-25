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

test('should find functions in a class', () => {
  class BaseClass {
    method1() {}
    method2() {}
  }

  class TestClass extends BaseClass {
    method3() {}
  }

  const instance = new TestClass();
  bindFunctions(instance);

  expect([...Utils.getObjectFunctionProperties(BaseClass.prototype)]).toEqual([
    'method1',
    'method2',
  ]);
  expect([...Utils.getObjectFunctionProperties(TestClass.prototype)]).toEqual(['method3']);
});

test('can check Prerelease Semvers', () => {
  expect(isSemverSatisfied('2.0.0-alpha.1', '2.0.0-alpha.1')).toBeTruthy();
  expect(isSemverSatisfied('2.0.0-alpha.1', '2.0.0-alpha.2')).toBeTruthy();
});

test('can handle v in front of versions', () => {
  expect(isSemverSatisfied('v2.0.0-alpha.1', '2.0.0-alpha.1')).toBeTruthy();
});
