import {
  array,
  bigint,
  boolean,
  buffer,
  date,
  ExtractSchemaType,
  number,
  object,
  string,
} from '../index';
import ObjectSchema from '../lib/ObjectSchema';

test('should be able to create an object schema', () => {
  const schema = object({
    one: boolean(),
    two: string(),
    three: number({ optional: true }),
  });
  const testOptional: ExtractSchemaType<typeof schema> = {
    one: true,
    two: 'two',
  };
  expect(testOptional).toBeTruthy();
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

  const record = {
    one: string({ optional: true }),
    two: string({ format: 'email' }),
    nested: object({
      three: buffer({ optional: true }),
      four: number({ optional: false }),
    }),
    nestedWithFields: object({
      optional: true,
      fields: {
        five: number({ optional: true }),
        six: date(),
        seven: bigint({ optional: false }),
      },
    }),
  };

  // test out some nested optionals (just in typescript)
  const nestedOptionalSchema: ExtractSchemaType<typeof record> = {
    two: 'two',
    nested: {
      four: 1,
    },
  };
  expect(nestedOptionalSchema).toBeTruthy();

  const nestedBadTypeField: ExtractSchemaType<typeof record> = {
    two: 'two',
    nested: {
      four: 1,
    },
    // @ts-expect-error
    nestedWithFields: { bad: true, seven: 2n, six: new Date() },
  };
  expect(nestedBadTypeField).toBeTruthy();

  const nestedOptionalField: ExtractSchemaType<typeof record> = {
    two: 'two',
    nested: {
      four: 1,
    },
    nestedWithFields: { seven: 2n, six: new Date() },
  };
  expect(nestedOptionalField).toBeTruthy();

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
