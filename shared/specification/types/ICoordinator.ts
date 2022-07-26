import { z } from 'zod';
import { addressValidation, identityValidation, signatureValidation } from '../common';
import { StakeSignatureSchema } from './IStakeSignature';

export const CoordinatorSchema = z.object({
  identity: identityValidation,
  reputation: z.number().int().nonnegative(),
  proofSignature: signatureValidation,
  stakeSignature: StakeSignatureSchema,
  paymentAddress: addressValidation,
});

type ICoordinator = z.infer<typeof CoordinatorSchema>;

export default ICoordinator;
