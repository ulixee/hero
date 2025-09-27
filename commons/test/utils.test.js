"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils = require("../lib/utils");
const utils_1 = require("../lib/utils");
const VersionUtils_1 = require("../lib/VersionUtils");
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
        method1() { }
        method2() { }
    }
    class TestClass extends BaseClass {
        method3() { }
    }
    const instance = new TestClass();
    (0, utils_1.bindFunctions)(instance);
    expect([...Utils.getObjectFunctionProperties(BaseClass.prototype)]).toEqual([
        'method1',
        'method2',
    ]);
    expect([...Utils.getObjectFunctionProperties(TestClass.prototype)]).toEqual(['method3']);
});
test('can check Prerelease Semvers', () => {
    expect((0, VersionUtils_1.isSemverSatisfied)('2.0.0-alpha.1', '2.0.0-alpha.1')).toBeTruthy();
    expect((0, VersionUtils_1.isSemverSatisfied)('2.0.0-alpha.1', '2.0.0-alpha.2')).toBeTruthy();
});
test('can handle v in front of versions', () => {
    expect((0, VersionUtils_1.isSemverSatisfied)('v2.0.0-alpha.1', '2.0.0-alpha.1')).toBeTruthy();
});
//# sourceMappingURL=utils.test.js.map