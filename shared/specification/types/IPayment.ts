import { z } from 'zod';
import {
  blockHeightValidation,
  hashValidation,
  identityValidation,
  micronoteIdValidation,
  micronoteTokenValidation,
  signatureValidation,
} from '../common';

export const PaymentSchema = z.object({
  microgons: micronoteTokenValidation,
  micronoteId: micronoteIdValidation,
  blockHeight: blockHeightValidation,
  micronoteBatchUrl: z.string().url(),
  micronoteBatchIdentity: identityValidation,
  micronoteSignature: signatureValidation,
  sidechainIdentity: identityValidation,
  sidechainValidationSignature: signatureValidation,
  guaranteeBlockHash: hashValidation,
  guaranteeBlockHeight: blockHeightValidation,
});

type IPayment = z.infer<typeof PaymentSchema>;

export default IPayment;
