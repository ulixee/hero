import { BrowserUtils, Helpers, TestLogger } from '@ulixee/unblocked-agent-testing/index';
import TypeSerializer, { stringifiedTypeSerializerClass } from '@ulixee/commons/lib/TypeSerializer';
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
    testObject = {
      name: 'original',
      map: new Map<string, number>([
        ['1', 1],
        ['2', 2],
      ]),
      set: new Set([1, 2, 3, 4]),
      regex: /test13234/gi,
      date: new Date('2021-03-17T15:41:06.513Z'),
      buffer: Buffer.from('This is a test buffer'),
      error: new CanceledPromiseError('This is canceled'),
    };

    testObject.nestedObject = { ...testObject, name: 'nested' };
    testObject.nestedArray = [
      { ...testObject, name: 'item1' },
      { ...testObject, name: 'item2' },
    ];

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
