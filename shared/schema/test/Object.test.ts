import { array, boolean, ExtractSchemaType, number, object, string } from '../index';

test('should be able to create an object schema', () => {
  const schema = object({
    fields: {
      one: boolean(),
      two: string(),
      three: number({ optional: true }),
    },
  });
  expect(schema.validate({ one: true, two: '' }).success).toBe(true);
  expect(schema.validate({ one: true, two: '', three: 1 }).success).toBe(true);
  expect(schema.validate({ one: true, two: '', three: '' }).success).toBe(false);
  expect(schema.validate({ one: true, two: '', three: '' }).errors).toHaveLength(1);
  expect(schema.validate({ one: true, two: '', three: '' }).errors[0]).toEqual(
    expect.objectContaining({
      code: 'invalidType',
      path: '.three',
    }),
  );
});

test('should be able to create an object schema with nested objects', () => {
  const nested = object({
    one: string(),
    two: string({ format: 'email' }),
  });

  const schema = object({
    fields: {
      one: boolean(),
      twoArray: array(nested),
    },
  });
  expect(schema.validate({ one: true, two: '' }).success).toBe(false);
  expect(schema.validate({ one: true, twoArray: '' }).errors[0]).toEqual(
    expect.objectContaining({
      code: 'invalidType',
      path: '.twoArray',
    }),
  );

  const jsonExample: ExtractSchemaType<typeof schema> = {
    one: false,
    twoArray: [
      {
        one: 'one',
        two: 'email@gmail.com',
      },
      {
        one: 'two',
        two: 'notAnEmail',
      },
    ],
  };

  expect(schema.validate(jsonExample).errors[0]).toEqual(
    expect.objectContaining({
      code: 'constraintFailed',
      path: '.twoArray.1.two',
    }),
  );
});
