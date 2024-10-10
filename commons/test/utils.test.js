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
test('should get all functions of an object hierarchy', () => {
    class BaseClass {
        method1() { }
        method2() { }
    }
    class TestClass extends BaseClass {
        method3() { }
    }
    const instance = new TestClass();
    const hierarchy = Utils.getPrototypeHierarchy(instance);
    expect(hierarchy[0]).toEqual(BaseClass.prototype);
    expect(hierarchy[1]).toEqual(TestClass.prototype);
    expect(hierarchy[2]).toEqual(instance);
    // cache should return the same set
    expect(Utils.getPrototypeHierarchy(instance)).toEqual(hierarchy);
    (0, utils_1.bindFunctions)(instance);
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
    expect((0, VersionUtils_1.isSemverSatisfied)('2.0.0-alpha.1', '2.0.0-alpha.1')).toBeTruthy();
    expect((0, VersionUtils_1.isSemverSatisfied)('2.0.0-alpha.1', '2.0.0-alpha.2')).toBeTruthy();
});
test('can handle v in front of versions', () => {
    expect((0, VersionUtils_1.isSemverSatisfied)('v2.0.0-alpha.1', '2.0.0-alpha.1')).toBeTruthy();
});
//# sourceMappingURL=utils.test.js.map