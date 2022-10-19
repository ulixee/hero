import { z } from 'zod';

export const schemaVersionHashValidation = z
  .string()
  .length(62)
  .regex(
    /^sch1[ac-hj-np-z02-9]{58}/,
    'This is not a Schema versionHash (Bech32 encoded hash starting with "sch1").',
  );


// These are things we need to track, but not totally sure where yet
export const SchemaManifest = z.object({
  schemaCoreHash: schemaVersionHashValidation.describe(
    'A hash of the main attributes of the schema to avoid changes for minor description changes',
  ),
  baseSchemaHash: schemaVersionHashValidation,
  previousVersionHash: schemaVersionHashValidation,
});

type ISchemaManifest = z.infer<typeof SchemaManifest>;

export default ISchemaManifest;
export { z };
