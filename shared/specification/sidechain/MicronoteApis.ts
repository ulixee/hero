import { z } from 'zod';
import {
  addressValidation,
  blockHeightValidation,
  hashValidation,
  micronoteBatchSlugValidation,
  micronoteIdValidation,
  micronoteTokenValidation,
  publicKeyValidation,
  signatureValidation,
} from '../common';
import { IZodSchemaToApiTypes } from '../utils/IZodApi';
import { WalletSignatureSchema } from '../types/IWalletSignature';

export const MicronoteApiSchemas = {
  'Micronote.create': {
    args: z.object({
      address: addressValidation,
      microgons: micronoteTokenValidation.lt(1000e6), // $1000 max = 1000*1M microgon max
      fundsId: z.number().int().positive().optional(),
      batchSlug: micronoteBatchSlugValidation,
      signature: WalletSignatureSchema,
      isAuditable: z.boolean().optional(),
    }),
    result: z.object({
      id: micronoteIdValidation,
      micronoteSignature: signatureValidation,
      blockHeight: blockHeightValidation,
      fundsId: z.number().int().positive(),
      guaranteeBlockHash: hashValidation,
      guaranteeBlockHeight: blockHeightValidation,
      fundMicrogonsRemaining: micronoteTokenValidation,
    }),
  },
  'Micronote.claim': {
    args: z.object({
      batchSlug: micronoteBatchSlugValidation,
      id: micronoteIdValidation,
      publicKey: publicKeyValidation,
      tokenAllocation: z.record(addressValidation, micronoteTokenValidation),
      signature: signatureValidation,
    }),
    result: z.object({
      finalCost: z.number().nonnegative().int(),
    }),
  },
  'Micronote.lock': {
    args: z.object({
      id: micronoteIdValidation,
      publicKey: publicKeyValidation,
      signature: signatureValidation,
      batchSlug: micronoteBatchSlugValidation,
    }),
    result: z.object({
      accepted: z.boolean(),
      currentBlockHeight: blockHeightValidation,
      currentBlockHash: hashValidation,
    }),
  },
};

type ICreateMicronoteResponse = z.infer<typeof MicronoteApiSchemas['Micronote.create']['result']>;

export { ICreateMicronoteResponse };

type IMicronoteApis = IZodSchemaToApiTypes<typeof MicronoteApiSchemas>;
export default IMicronoteApis;
