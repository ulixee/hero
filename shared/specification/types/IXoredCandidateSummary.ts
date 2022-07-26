import { z } from 'zod';
import { addressValidation, identityValidation, signatureValidation } from '../common';
import { StakeSignatureSchema } from './IStakeSignature';

export const XoredCandidateSummarySchema = z.object({
  identity: identityValidation,
  reputation: z.number().nonnegative(),
  firstPingSignature: signatureValidation,
  secondPingSignature: signatureValidation,
  auditSignature: signatureValidation,
  stakeSignature: StakeSignatureSchema,
  paymentAddress: addressValidation,
});

type IXoredCandidateSummary = z.infer<typeof XoredCandidateSummarySchema>;
export default IXoredCandidateSummary;
