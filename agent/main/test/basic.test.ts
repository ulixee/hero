import { BrowserUtils, Helpers, TestLogger } from '@ulixee/unblocked-agent-testing/index';
import TypeSerializer, { stringifiedTypeSerializerClass } from '@ulixee/commons/lib/TypeSerializer';
import getTestObject from '@ulixee/commons/test/helpers/getTestObject';

import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import { Browser, BrowserContext } from '../index';

describe('basic tests', () => {
  let browser: Browser;
  let context: BrowserContext;
  let testObject: any;

  beforeEach(() => {
    TestLogger.testNumber += 1;
  });

  beforeAll(async () => {
    testObject = getTestObject();

    browser = new Browser(BrowserUtils.browserEngineOptions);
    Helpers.onClose(() => browser.close(), true);
    await browser.launch();

    const logger = TestLogger.forTest(module);
    context = await browser.newContext({ logger });
    Helpers.onClose(() => context.close(), true);
  });

  afterAll(Helpers.afterAll);
  afterEach(Helpers.afterEach);

  test('should be able to serialize and deserialize in a browser window', async () => {
    try {
      await browser.launch();
      const page = await context.newPage();
      await page.evaluate(`${stringifiedTypeSerializerClass}`);
      const serialized = TypeSerializer.stringify(testObject);

      const result = await page.evaluate<any>(`(function() {
    const decodedInClient = TypeSerializer.parse(JSON.stringify(${serialized}));
    return TypeSerializer.stringify(decodedInClient);
})()`);
      expect(typeof result).toBe('string');
      const decoded = TypeSerializer.parse(result);
      expect(decoded).toEqual(testObject);
    } finally {
      await browser.close();
    }
  });
});
