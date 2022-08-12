import { z } from 'zod';
import { blockHeightValidation, identityValidation, signatureValidation } from '../common';
import { WebhitsClaimAddressSchema } from './IWebhitsClaimAddress';
import { MicronoteBatchDatumsSchema } from './IMicronoteBatchDatums';

export const DatumSummarySchema = z.object({
  identity: identityValidation,
  blockHeight: blockHeightValidation,
  averageXoredCandidates: z.number().int().nonnegative(),
  datumsPerMicronoteBatch: MicronoteBatchDatumsSchema.array(),
  webhitsClaimAddresses: WebhitsClaimAddressSchema.array(),
  signature: signatureValidation, // need signature from original user to make sure hash that gets put into network is truly from you (should include block height)
});

type IDatumSummary = z.infer<typeof DatumSummarySchema>;

export default IDatumSummary;
