import { z } from 'zod';
import { blockHeightValidation, identityValidation, signatureValidation } from '../common';

export const StakeSignatureSchema = z.object({
  signature: signatureValidation,
  blockHeight: blockHeightValidation,
  rootIdentity: identityValidation,
});

type IStakeSignature = z.infer<typeof StakeSignatureSchema>;

export default IStakeSignature;
