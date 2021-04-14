import Puppet from '@secret-agent/puppet';
import ChromeLatest from '@secret-agent/emulate-chrome-latest';
import TypeSerializer, { stringifiedTypeSerializerClass } from '../TypeSerializer';
import { CanceledPromiseError } from '../interfaces/IPendingWaitEvent';
import logger from '../Logger';

const { log } = logger(module);

let testObject: any;
beforeAll(() => {
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
});

test('it should be able to serialize a complex object in nodejs', () => {
  const result = TypeSerializer.stringify(testObject);
  expect(typeof result).toBe('string');
  const decoded = TypeSerializer.parse(result);
  expect(decoded).toEqual(testObject);
});

test('should be able to serialize and deserialize in a browser window', async () => {
  const puppet = new Puppet(ChromeLatest.engine);
  try {
    await puppet.start();
    const context = await puppet.newContext(
      {
        userAgent: 'Page tests',
        proxyPassword: '',
        viewport: { width: 1920, height: 800 } as any,
      } as any,
      log,
    );
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
    await puppet.close();
  }
});
