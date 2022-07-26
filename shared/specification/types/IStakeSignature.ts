import { z } from 'zod';
import { blockHeightValidation, publicKeyValidation, signatureValidation } from '../common';

export const StakeSignatureSchema = z.object({
  signature: signatureValidation,
  blockHeight: blockHeightValidation,
  rootPublicKey: publicKeyValidation,
});

type IStakeSignature = z.infer<typeof StakeSignatureSchema>;

export default IStakeSignature;
