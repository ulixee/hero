import { z } from 'zod';
import {
  blockHeightValidation,
  identityValidation,
  micronoteIdValidation,
  micronoteTokenValidation,
  signatureValidation,
} from '../common';
import { MicronoteBatchSchema } from './IMicronoteBatch';

export const PaymentSchema = z.object({
  microgons: micronoteTokenValidation,
  micronoteId: micronoteIdValidation,
  blockHeight: blockHeightValidation,
  batchSlug: MicronoteBatchSchema.shape.batchSlug,
  isCreditBatch: z.boolean(),
  micronoteBatchUrl: z.string().url(),
  micronoteBatchIdentity: identityValidation,
  micronoteSignature: signatureValidation,
  sidechainIdentity: identityValidation,
  sidechainValidationSignature: signatureValidation,
  // guaranteeBlockHash: hashValidation.describe('TODO: Add back in. This should tell a server what block hash they can choose to trust or not'),
  guaranteeBlockHeight: blockHeightValidation,
});

type IPayment = z.infer<typeof PaymentSchema>;

export default IPayment;
