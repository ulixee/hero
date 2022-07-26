import { z } from 'zod';
import { addressValidation, identityValidation, isHex, signatureValidation } from '../common';

export const MicronoteBatchSchema = z.object({
  batchSlug: z.string().regex(/^(?:credit_|micro_)(0x|0h)?[0-9A-F]+$/i).length(14),
  isCreditBatch: z.boolean(),
  micronoteBatchIdentity: identityValidation,
  micronoteBatchAddress: addressValidation,
  sidechainIdentity: identityValidation,
  sidechainValidationSignature: signatureValidation,
});

type IMicronoteBatch = z.infer<typeof MicronoteBatchSchema>;

export default IMicronoteBatch;
