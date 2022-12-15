import { z } from 'zod';
import {
  addressValidation,
  blockHeightValidation,
  hashValidation,
  identityValidation,
  micronoteIdValidation,
  micronoteTokenValidation,
  signatureValidation,
} from '../common';
import { IZodSchemaToApiTypes } from '../utils/IZodApi';
import { AddressSignatureSchema } from '../types/IAddressSignature';
import { MicronoteBatchSchema } from '../types/IMicronoteBatch';

export const MicronoteApiSchemas = {
  'Micronote.create': {
    args: z.object({
      batchSlug: MicronoteBatchSchema.shape.batchSlug,
      address: addressValidation,
      microgons: micronoteTokenValidation.lte(1000e6), // $1000 max = 1000*1M microgon max
      fundsId: z.string().length(30).optional(),
      signature: AddressSignatureSchema,
      isAuditable: z.boolean().optional(),
    }),
    result: z.object({
      id: micronoteIdValidation,
      micronoteSignature: signatureValidation,
      blockHeight: blockHeightValidation,
      fundsId: z.string().length(30),
      guaranteeBlockHeight: blockHeightValidation,
      fundMicrogonsRemaining: micronoteTokenValidation,
    }),
  },
  'Micronote.hold': {
    args: z.object({
      batchSlug: MicronoteBatchSchema.shape.batchSlug,
      id: micronoteIdValidation,
      identity: identityValidation,
      signature: signatureValidation,
      microgons: micronoteTokenValidation.describe('Number of microgons to put on hold.'),
      holdAuthorizationCode: z
        .string()
        .length(16)
        .optional()
        .describe('Authorization code provided to hold funds.'),
    }),
    result: z.object({
      holdAuthorizationCode: z
        .string()
        .length(16)
        .optional()
        .describe(
          'An authorization code that can be used to claim funds against a Micronote. Only returned to the first claimer.',
        ),
      holdId: z
        .string()
        .length(30)
        .optional()
        .describe('A holdId to settle. If insufficient funds, this value will not be returned.'),
      accepted: z.boolean(),
      remainingBalance: micronoteTokenValidation.describe(
        'Number of microgons remaining on this miconote.',
      ),
      currentBlockHeight: blockHeightValidation,
      currentBlockHash: hashValidation,
    }),
  },
  'Micronote.settle': {
    args: z.object({
      batchSlug: MicronoteBatchSchema.shape.batchSlug,
      id: micronoteIdValidation,
      identity: identityValidation,
      tokenAllocation: z.record(addressValidation, micronoteTokenValidation),
      signature: signatureValidation,
      holdId: z
        .string()
        .length(30)
        .optional()
        .describe('A hold id that will settle funds allocated in a hold.'),
      isFinal: z.boolean().describe('Should this call finalize the Micronote and return change.'),
    }),
    result: z.object({
      finalCost: z.number().nonnegative().int().optional(),
    }),
  },
};

type IMicronoteApis = IZodSchemaToApiTypes<typeof MicronoteApiSchemas>;
export default IMicronoteApis;
