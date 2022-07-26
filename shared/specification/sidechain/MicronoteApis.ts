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
      fundsId: z.number().int().positive().optional(),
      signature: AddressSignatureSchema,
      isAuditable: z.boolean().optional(),
    }),
    result: z.object({
      id: micronoteIdValidation,
      micronoteSignature: signatureValidation,
      blockHeight: blockHeightValidation,
      fundsId: z.number().int().positive(),
      guaranteeBlockHeight: blockHeightValidation,
      fundMicrogonsRemaining: micronoteTokenValidation,
    }),
  },
  'Micronote.lock': {
    args: z.object({
      batchSlug: MicronoteBatchSchema.shape.batchSlug,
      id: micronoteIdValidation,
      identity: identityValidation,
      signature: signatureValidation,
      addresses: addressValidation
        .array()
        .optional()
        .describe('Optional list of addresses to ensure can be paid with this Micronote'),
    }),
    result: z.object({
      accepted: z.boolean(),
      currentBlockHeight: blockHeightValidation,
      currentBlockHash: hashValidation,
    }),
  },
  'Micronote.claim': {
    args: z.object({
      batchSlug: MicronoteBatchSchema.shape.batchSlug,
      id: micronoteIdValidation,
      identity: identityValidation,
      tokenAllocation: z.record(addressValidation, micronoteTokenValidation),
      signature: signatureValidation,
    }),
    result: z.object({
      finalCost: z.number().nonnegative().int(),
    }),
  },
};

type IMicronoteApis = IZodSchemaToApiTypes<typeof MicronoteApiSchemas>;
export default IMicronoteApis;
