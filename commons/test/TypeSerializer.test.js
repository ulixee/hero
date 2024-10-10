"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TypeSerializer_1 = require("../lib/TypeSerializer");
const IPendingWaitEvent_1 = require("../interfaces/IPendingWaitEvent");
let testObject;
beforeAll(() => {
    testObject = {
        name: 'original',
        map: new Map([
            ['1', 1],
            ['2', 2],
        ]),
        set: new Set([1, 2, 3, 4]),
        regex: /test13234/gi,
        date: new Date('2021-03-17T15:41:06.513Z'),
        buffer: Buffer.from('This is a test buffer'),
        error: new IPendingWaitEvent_1.CanceledPromiseError('This is canceled'),
    };
    testObject.nestedObject = { ...testObject, name: 'nested' };
    testObject.nestedArray = [
        { ...testObject, name: 'item1' },
        { ...testObject, name: 'item2' },
    ];
});
test('it should be able to serialize a complex object in nodejs', () => {
    const result = TypeSerializer_1.default.stringify(testObject);
    expect(typeof result).toBe('string');
    const decoded = TypeSerializer_1.default.parse(result);
    expect(decoded).toEqual(testObject);
});
//# sourceMappingURL=TypeSerializer.test.js.map