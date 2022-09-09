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
      settlementFeeMicrogons: micronoteTokenValidation,
      batchDurationMinutes: z.number().int(),
    }),
  },
  'Sidechain.audit': {
    args: z.undefined().nullish(),
    result: z.object({
      auditDate: z.date(),
      argonsInCirculation_e2: z
        .bigint()
        .describe('Argons with centagon precision as a whole number (e-2).'),
      argonsBurnedYesterday_e2: z
        .bigint()
        .describe('Argons burned in the previous day (starting UTC 0:00 to UTC 23:59).'),
      argonsBurnedRolling30DayAverage_e2: z
        .bigint()
        .describe('Average daily Argons burned over the previous 30 days.'),
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
