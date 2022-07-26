import { z } from 'zod';
import {
  addressValidation,
  hashValidation,
  identityValidation,
  micronoteTokenValidation,
  signatureValidation,
} from '../common';
import { StakeSignatureSchema } from './IStakeSignature';

export const XoredCandidateSchema = z.object({
  nodeId: z.string(),
  identity: identityValidation,
  publicIp: z.string(),
  publicPort: z.number().int().positive(),
  reputation: z.number().int().nonnegative(),
  signature: signatureValidation,
  available: z.boolean(),
  stakeSignature: StakeSignatureSchema,
  pricePerKb: micronoteTokenValidation,
  pricePerQuery: micronoteTokenValidation,
  firstPingSignature: signatureValidation,
  secondPingSignature: signatureValidation,
  result: z.any(),
  resultHash: hashValidation,
  webhitsClaimAddress: addressValidation,
  resultSignature: signatureValidation,
  resultError: z.object({
    name: z.string(),
    description: z.string(),
  }),
  isConsensusResult: z.boolean(),
  isHighReputationRunner: z.boolean(),
  paymentAddress: addressValidation,
});

type IXoredCandidate = z.infer<typeof XoredCandidateSchema>;
export default IXoredCandidate;
