import { z } from 'zod';
import { blockHeightValidation, identityValidation, signatureValidation } from '../common';
import { MicronoteBatchDatumsSchema } from './IMicronoteBatchDatums';
import { WebhitsClaimAddressSchema } from './IWebhitsClaimAddress';

export const BitDatumHistorySchema = z.object({
  identity: identityValidation,
  blockHeight: blockHeightValidation,
  averageXoredCandidates: z.number().int().nonnegative(),
  datumsPerMicronoteBatch: MicronoteBatchDatumsSchema.array(),
  webhitsClaimAddresses: WebhitsClaimAddressSchema.array(),
  signature: signatureValidation, // need signature from original user to make sure hash that gets put into network is truly from you (should include block height)
});

type IBitDatumHistory = z.infer<typeof BitDatumHistorySchema>;

export default IBitDatumHistory;
