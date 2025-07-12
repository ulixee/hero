"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("@ulixee/unblocked-agent-testing/index");
const TypeSerializer_1 = require("@ulixee/commons/lib/TypeSerializer");
const getTestObject_1 = require("@ulixee/commons/test/helpers/getTestObject");
const index_2 = require("../index");
describe('basic tests', () => {
    let browser;
    let context;
    let testObject;
    beforeEach(() => {
        index_1.TestLogger.testNumber += 1;
    });
    beforeAll(async () => {
        testObject = (0, getTestObject_1.default)();
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