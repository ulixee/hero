import { z } from 'zod';
import { IZodSchemaToApiTypes } from '../utils/IZodApi';
import { identityValidation, micronoteTokenValidation, signatureValidation } from '../common';
import { PaymentSchema } from '../types/IPayment';

export const databoxVersionHashValidation = z
  .string()
  .length(62)
  .regex(
    /^dbx1[ac-hj-np-z02-9]{58}/,
    'This is not a Databox versionHash (Bech32 encoded hash starting with "dbx1").',
  );

const positiveInt = z.number().int().positive();

export const DataboxApiSchemas = {
  'Databox.upload': {
    args: z.object({
      compressedDatabox: z.instanceof(Buffer).describe('Bytes of a compressed .dbx file'),
      allowNewLinkedVersionHistory: z
        .boolean()
        .describe(
          'Allow this upload to start a new version chain (do not link to previous versions)',
        ),
      uploaderIdentity: identityValidation
        .optional()
        .describe('If this server is private, an approved uploader Identity'),
      uploaderSignature: signatureValidation
        .optional()
        .describe('A signature from an approved uploader Identity'),
    }),
    result: z.object({
      success: z.boolean(),
    }),
  },
  'Databox.meta': {
    args: z.object({
      versionHash: databoxVersionHashValidation.describe('The hash of a unique databox version'),
    }),
    result: z.object({
      latestVersionHash: databoxVersionHashValidation.describe(
        'The latest version hash of this databox',
      ),
      functionsByName: z.record(
        z.string().describe('The name of a function'),
        z.object({
          averageBytesPerQuery: positiveInt.describe('Average bytes of output returned per query.'),
          maxBytesPerQuery: positiveInt.describe('The largest byte count seen.'),
          averageMilliseconds: positiveInt.describe('Average milliseconds spent before response.'),
          maxMilliseconds: positiveInt.describe('Max milliseconds spent before response.'),
          averageTotalPricePerQuery: positiveInt.describe(
            'Average total microgons paid for a query.',
          ),
          maxPricePerQuery: positiveInt.describe('The largest total microgon price seen.'),
          basePricePerQuery: micronoteTokenValidation.describe(
            'The function base price per query.',
          ),
        }),
      ),
      computePricePerKb: micronoteTokenValidation.describe(
        'The current server price per kilobyte. NOTE: if a server is implementing surge pricing, this amount could vary.',
      ),
      schemaInterface: z
        .string()
        .optional()
        .describe('A Typescript interface describing Function inputs and outputs this Databox.'),
      giftCardIssuerIdentities: identityValidation
        .array()
        .describe('The identities this databox allows gift card payments for (if any).'),
    }),
  },
  'Databox.query': {
    args: z.object({
      sql: z.string().describe('The SQL command(s) you want to run'),
      boundValues: z.array(z.any()).optional().describe('An array of values you want to use as bound parameters'),
      versionHash: databoxVersionHashValidation.describe('The hash of this unique databox version'),
      payment: PaymentSchema.optional().describe(
        'Payment for this request created with an approved Ulixee Sidechain.',
      ),
      pricingPreferences: z
        .object({
          maxComputePricePerKb: micronoteTokenValidation.describe(
            'Maximum price to pay for compute costs per kilobyte (NOTE: This only applies to Servers implementing surge pricing).',
          ),
        })
        .optional(),
    }),
    result: z.object({
      latestVersionHash: databoxVersionHashValidation,
      output: z.any().optional(),
      error: z.any().optional(),
      metadata: z
        .object({
          microgons: micronoteTokenValidation,
          bytes: z.number().int().nonnegative(),
          milliseconds: z.number().int().nonnegative(),
        })
        .optional(),
    }),
  },
  'Databox.queryLocalScript': {
    args: z.object({
      sql: z.string().describe('The SQL command(s) you want to run'),
      boundValues: z.array(z.any()).optional().describe('An array of values you want to use as bound parameters'),
      scriptPath: z
        .string()
        .describe('A path to a local script to run. NOTE: API only enabled in development.'),
    }),
    result: z.object({
      latestVersionHash: databoxVersionHashValidation,
      output: z.any().optional(),
      error: z.any().optional(),
    }),
  },
  'Databox.createInMemoryTable': {
    args: z.object({
      name: z.string(),
      schema: z.any({}),
      seedlings: z.any({}).optional(),
      databoxInstanceId: z.string(),
    }), 
    result: z.object({}),
  },
  'Databox.createInMemoryFunction': {
    args: z.object({
      name: z.string(),
      schema: z.any({}),
      databoxInstanceId: z.string(),
    }), 
    result: z.object({}),
  },
  'Databox.queryInternalTable': {
    args: z.object({
      name: z.string(),
      sql: z.string(),
      boundValues: z.any({}).optional(),
      databoxVersionHash: z.string().optional(),
      databoxInstanceId: z.string().optional(),
    }), 
    result: z.any({}),
  },
  'Databox.queryInternalFunction': {
    args: z.object({
      name: z.string(),
      sql: z.string(),
      boundValues: z.any({}).optional(),
      input: z.any({}).optional(),
      output: z.array(z.any({})),
      databoxVersionHash: z.string().optional(),
      databoxInstanceId: z.string().optional(),
    }), 
    result: z.any({}),
  },
  'Databox.queryInternal': {
    args: z.object({
      sql: z.string(),
      boundValues: z.any({}).optional(),
      inputByFunctionName: z.record(z.any()),
      outputByFunctionName: z.record(z.array(z.any({}))),
      databoxVersionHash: z.string().optional(),
      databoxInstanceId: z.string().optional(),
    }), 
    result: z.any({}),
  },
};

type IDataboxApiTypes = IZodSchemaToApiTypes<typeof DataboxApiSchemas>;

export default IDataboxApiTypes;
