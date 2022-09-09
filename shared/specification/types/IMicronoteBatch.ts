import { z } from 'zod';
import { addressValidation, identityValidation, signatureValidation } from '../common';

export const MicronoteBatchSchema = z.object({
  batchHost: z.string().url(),
  batchSlug: z
    .string()
    .regex(/^(?:gifts_|micro_)[0-9A-F]+$/i)
    .length(14),
  plannedClosingTime: z.date(),
  stopNewNotesTime: z.date(),
  isGiftCardBatch: z.boolean(),
  minimumFundingCentagons: z.bigint().refine(x => x >= 1n),
  micronoteBatchIdentity: identityValidation,
  micronoteBatchAddress: addressValidation,
  sidechainIdentity: identityValidation,
  sidechainValidationSignature: signatureValidation,
});

type IMicronoteBatch = z.infer<typeof MicronoteBatchSchema>;

export default IMicronoteBatch;
