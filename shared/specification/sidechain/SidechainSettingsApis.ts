import { z } from 'zod';
import { IZodSchemaToApiTypes } from '../utils/IZodApi';
import { identityValidation, micronoteTokenValidation, signatureValidation } from '../common';
import { BlockSettingsSchema } from '../types/IBlockSettings';

export const SidechainSettingsApiSchemas = {
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
};

type ISidechainSettingsApis = IZodSchemaToApiTypes<typeof SidechainSettingsApiSchemas>;
export default ISidechainSettingsApis;
