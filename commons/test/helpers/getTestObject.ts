import { CanceledPromiseError } from '../../interfaces/IPendingWaitEvent';

export default function getTestObject() {
  const testObject: any = {
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
    uintArray: Uint32Array.from([4, 5]),
    intArray: Int32Array.from([4, 7]),
    floatArray: Float32Array.from([4.1]),
    float64Array: Float64Array.from([4.1, 5.3]),
  };

  testObject.nestedObject = { ...testObject, name: 'nested' };
  testObject.nestedArray = [
    { ...testObject, name: 'item1' },
    { ...testObject, name: 'item2' },
  ];

  return testObject;
}
