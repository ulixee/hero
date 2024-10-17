"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("@ulixee/unblocked-agent-testing/index");
const TypeSerializer_1 = require("@ulixee/commons/lib/TypeSerializer");
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const index_2 = require("../index");
describe('basic tests', () => {
    let browser;
    let context;
    let testObject;
    beforeEach(() => {
        index_1.TestLogger.testNumber += 1;
    });
    beforeAll(async () => {
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
        browser = new index_2.Browser(index_1.BrowserUtils.browserEngineOptions);
        index_1.Helpers.onClose(() => browser.close(), true);
        await browser.launch();
        const logger = index_1.TestLogger.forTest(module);
        context = await browser.newContext({ logger });
        index_1.Helpers.onClose(() => context.close(), true);
    });
    afterAll(index_1.Helpers.afterAll);
    afterEach(index_1.Helpers.afterEach);
    test('should be able to serialize and deserialize in a browser window', async () => {
        try {
            await browser.launch();
            const page = await context.newPage();
            await page.evaluate(`${TypeSerializer_1.stringifiedTypeSerializerClass}`);
            const serialized = TypeSerializer_1.default.stringify(testObject);
            const result = await page.evaluate(`(function() {
    const decodedInClient = TypeSerializer.parse(JSON.stringify(${serialized}));
    return TypeSerializer.stringify(decodedInClient);
})()`);
            expect(typeof result).toBe('string');
            const decoded = TypeSerializer_1.default.parse(result);
            expect(decoded).toEqual(testObject);
        }
        finally {
            await browser.close();
        }
    });
});
//# sourceMappingURL=basic.test.js.map