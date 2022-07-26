import { z } from 'zod';
import {
  blockHeightValidation,
  hashValidation,
  micronoteIdValidation,
  micronoteTokenValidation,
  publicKeyValidation,
  signatureValidation,
} from '../common';

export const PaymentSchema = z.object({
  microgons: micronoteTokenValidation,
  micronoteId: micronoteIdValidation,
  blockHeight: blockHeightValidation,
  micronoteBatchUrl: z.string().url(),
  micronoteBatchPublicKey: publicKeyValidation,
  micronoteSignature: signatureValidation,
  sidechainPublicKey: publicKeyValidation,
  sidechainValidationSignature: signatureValidation,
  guaranteeBlockHash: hashValidation,
  guaranteeBlockHeight: blockHeightValidation,
});

type IPayment = z.infer<typeof PaymentSchema>;

export default IPayment;
