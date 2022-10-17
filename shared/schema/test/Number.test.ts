import { bigint, number } from '../index';

test('should be able to create an int schema', () => {
  const schema = number({ integer: true });
  expect(schema.validate(1).success).toBe(true);
  expect(schema.validate('test').success).toBe(false);
  expect(schema.validate(1.2).success).toBe(false);
});

test('should be able to create an decimal schema', () => {
  const schema = number({ decimals: 1 });
  expect(schema.validate(1.1).success).toBe(true);
  expect(schema.validate('test').success).toBe(false);
  expect(schema.validate(1).success).toBe(false);
});

test('should be able to create an bigint schema', () => {
  const schema = bigint();
  expect(schema.validate(1n).success).toBe(true);
  expect(schema.validate('test').success).toBe(false);
  expect(schema.validate(1).success).toBe(false);
});

test('should be able to validate a number has a max range', () => {
  const schema = number({ max: 10 });
  expect(schema.validate(0).success).toBe(true);
  expect(schema.validate(-190).success).toBe(true);
  expect(schema.validate(11).success).toBe(false);
});

test('should be able to validate a number has a min range', () => {
  const schema = number({ min: 0 });
  expect(schema.validate(1).success).toBe(true);
  expect(schema.validate(-190).success).toBe(false);
  expect(schema.validate(1).success).toBe(true);
});
