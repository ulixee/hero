import { array, bigint, number, object, string } from '../index';
import jsonToSchemaCode from '../lib/jsonToSchemaCode';

test('should be able to generate a schema from json', () => {
  const schema = object({
    field1: string({ description: 'This is a test', format: 'email' }),
    field2: string({ length: 4 }),
    field3: string({ optional: true }),
    'field-4': number(),
  });
  const json = JSON.parse(JSON.stringify(schema));

  const schema2 = jsonToSchemaCode(json, new Set());

  expect(schema2).toBe(`object({
  field1: string({
    description: "This is a test",
    format: "email",
  }),
  field2: string({ length: 4 }),
  field3: string({ optional: true }),
  "field-4": number(),
})`);
});

test('should be able to generate a nested object structure from json', () => {
  const schema = {
    test: object({
      optional: false,
      fields: {
        field1: string({ description: 'This is a test', format: 'email' }),
        field3: array(object({ 'tester-2': number({ optional: true }) })),
      },
    }),
    test2: bigint(),
  };
  const json = JSON.parse(JSON.stringify(schema));

  const schema2 = jsonToSchemaCode(json, new Set());

  expect(schema2).toBe(`{
  test: object({
    field1: string({
      description: "This is a test",
      format: "email",
    }),
    field3: array(object({
      "tester-2": number({ optional: true }),
    })),
  }),
  test2: bigint(),
}`);
});
