"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TypeSerializer_1 = require("../lib/TypeSerializer");
const getTestObject_1 = require("./helpers/getTestObject");
let testObject;
beforeAll(() => {
    testObject = (0, getTestObject_1.default)();
});
test('it should be able to serialize a complex object in nodejs', () => {
    const result = TypeSerializer_1.default.stringify(testObject);
    expect(typeof result).toBe('string');
    const decoded = TypeSerializer_1.default.parse(result);
    expect(decoded).toEqual(testObject);
});
//# sourceMappingURL=TypeSerializer.test.js.map