import { z } from 'zod';
import { addressValidation, isHex, publicKeyValidation, signatureValidation } from '../common';

export const MicronoteBatchSchema = z.object({
  batchSlug: z.string().regex(isHex).length(10),
  micronoteBatchPublicKey: publicKeyValidation,
  micronoteBatchAddress: addressValidation,
  sidechainPublicKey: publicKeyValidation,
  sidechainValidationSignature: signatureValidation,
});

type IMicronoteBatch = z.infer<typeof MicronoteBatchSchema>;

export default IMicronoteBatch;
