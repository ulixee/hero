import { z } from 'zod';
import { addressValidation, publicKeyValidation, signatureValidation } from '../common';
import { StakeSignatureSchema } from './IStakeSignature';

export const XoredCandidateSummarySchema = z.object({
  publicKey: publicKeyValidation,
  reputation: z.number().nonnegative(),
  firstPingSignature: signatureValidation,
  secondPingSignature: signatureValidation,
  auditSignature: signatureValidation,
  stakeSignature: StakeSignatureSchema,
  paymentAddress: addressValidation,
});

type IXoredCandidateSummary = z.infer<typeof XoredCandidateSummarySchema>;
export default IXoredCandidateSummary;
