import { z } from 'zod';
import { IZodSchemaToApiTypes } from '../utils/IZodApi';
import { identityValidation, micronoteTokenValidation, signatureValidation } from '../common';
import { BlockSettingsSchema } from '../types/IBlockSettings';
import { MicronoteBatchSchema } from '../types/IMicronoteBatch';

export const SidechainInfoApiSchemas = {
  'Sidechain.settings': {
    args: z.object({
      identity: identityValidation
        .nullish()
        .describe(
          'Provide an identity to get proof back that the Sidechain owns the rootIdentity.',
        ),
    }),
    result: z.object({
      version: z.string(),
      rootIdentities: identityValidation.array(),
      identityProofSignatures: signatureValidation.array().optional(),
      latestBlockSettings: BlockSettingsSchema,
      usdToArgonConversionRate: z.number(),
      settlementFeeMicrogons: micronoteTokenValidation,
      batchDurationMinutes: z.number().int(),
    }),
  },
  'Sidechain.openBatches': {
    args: z.undefined().nullish(),
    result: z.object({
      micronote: MicronoteBatchSchema.array(),
      giftCard: MicronoteBatchSchema.optional(),
    }),
  },
};

type ISidechainInfoApis = IZodSchemaToApiTypes<typeof SidechainInfoApiSchemas>;
export default ISidechainInfoApis;
