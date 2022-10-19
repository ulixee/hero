import { number, object, string } from '../index';
import schemaToInterface, { printNode } from '../lib/schemaToInterface';

test('should be able to generate a type', () => {
  const schema = object({
    field1: string({ description: 'This is a test', format: 'email' }),
    field2: string({ length: 4 }),
    field3: string({ optional: true }),
    'field-4': number(),
  });
  const ts = schemaToInterface(schema);
  expect(printNode(ts)).toBe(`{
  /**
   * This is a test
   * @format email
   */
  field1: string;
  /**
   * @length 4
   */
  field2: string;
  field3?: string;
  "field-4": number;
}`);
});
