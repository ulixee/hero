import { z } from 'zod';
import { addressValidation, identityValidation , databoxVersionHashValidation } from '../common';
import { DataboxFunctionPricing } from './IDataboxFunctionPricing';

const minDate = new Date('2022-01-01').getTime();

export const DataboxManifestSchema = z.object({
  versionHash: databoxVersionHashValidation,
  versionTimestamp: z.number().int().gt(minDate),
  linkedVersions: z
    .object({
      versionHash: databoxVersionHashValidation,
      versionTimestamp: z.number().int().gt(minDate),
    })
    .array()
    .describe('Older versions that should be redirected to this version'),
  scriptHash: z
    .string()
    .length(62)
    .regex(
      /^scr1[ac-hj-np-z02-9]{58}/,
      'This is not a Databox scripthash (Bech32 encoded hash starting with "scr").',
    ),
  scriptEntrypoint: z.string().describe('A relative path from a project root'),
  coreVersion: z.string().describe('Version of the Databox Core Runtime'),
  schemaInterface: z.string().optional().describe('The raw typescript schema for this Databox'),
  functionsByName: z.record(
    z
      .string()
      .regex(/[a-z][A-Za-z0-9]+/)
      .describe('The Function name'),
    z.object({
      corePlugins: z
        .record(z.string())
        .optional()
        .describe('plugin dependencies required for execution'),
      prices: DataboxFunctionPricing.array()
        .min(1)
        .optional()
        .describe(
          'Price details for a function call. This array will have an entry for each function called in this process. ' +
            'The first entry is the cost of the function packaged in this Databox.',
        ),
    }),
  ),
  paymentAddress: addressValidation.optional(),
  giftCardIssuerIdentity: identityValidation
    .optional()
    .describe('A gift card issuer identity for this Databox.'),
});

export type IVersionHistoryEntry = z.infer<
  typeof DataboxManifestSchema.shape.linkedVersions.element
>;
type IDataboxManifest = z.infer<typeof DataboxManifestSchema>;

export default IDataboxManifest;
