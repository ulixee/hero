import { z } from 'zod';
import { addressValidation, identityValidation, signatureValidation } from '../common';

export const MicronoteBatchSchema = z.object({
  batchSlug: z
    .string()
    .regex(/^(?:gifts_|micro_)[0-9A-F]+$/i)
    .length(14),
  isGiftCardBatch: z.boolean(),
  micronoteBatchIdentity: identityValidation,
  micronoteBatchAddress: addressValidation,
  sidechainIdentity: identityValidation,
  sidechainValidationSignature: signatureValidation,
});

type IMicronoteBatch = z.infer<typeof MicronoteBatchSchema>;

export default IMicronoteBatch;
