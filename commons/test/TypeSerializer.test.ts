import TypeSerializer from '../lib/TypeSerializer';
import getTestObject from './helpers/getTestObject';

let testObject: any;
beforeAll(() => {
  testObject = getTestObject();
});

test('it should be able to serialize a complex object in nodejs', () => {
  const result = TypeSerializer.stringify(testObject);
  expect(typeof result).toBe('string');
  const decoded = TypeSerializer.parse(result);
  expect(decoded).toEqual(testObject);
});
