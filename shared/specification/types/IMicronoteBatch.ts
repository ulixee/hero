import { z } from 'zod';
import { addressValidation, identityValidation, signatureValidation } from '../common';

export const MicronoteBatchSchema = z.object({
  batchHost: z.string().url(),
  batchSlug: z
    .string()
    .regex(/^[0-9A-Fa-f]+$/)
    .length(14),
  plannedClosingTime: z.date(),
  stopNewNotesTime: z.date(),
  minimumFundingCentagons: z.bigint().refine(x => x >= 1n),
  micronoteBatchIdentity: identityValidation,
  micronoteBatchAddress: addressValidation,
  sidechainIdentity: identityValidation,
  sidechainValidationSignature: signatureValidation,
});

type IMicronoteBatch = z.infer<typeof MicronoteBatchSchema>;

export default IMicronoteBatch;
