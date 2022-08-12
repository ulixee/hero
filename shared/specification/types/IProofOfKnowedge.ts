import { z } from 'zod';
import {
  addressValidation,
  blockHeightValidation,
  hashValidation,
  identityValidation,
  micronoteIdValidation,
  micronoteTokenValidation,
} from '../common';
import { XoredCandidateSchema } from './IXoredCandidate';
import { CoordinatorSchema } from './ICoordinator';

export const ProofOfKnowledgeSchema = z.object({
  hash: hashValidation,
  micronoteId: micronoteIdValidation,
  micronoteBlockHeight: blockHeightValidation,
  blockHeight: blockHeightValidation,
  xoredCandidates: XoredCandidateSchema.array(),
  coordinator: CoordinatorSchema,
  decoderHash: hashValidation,
  decoderReputation: z.number().int().nonnegative(),
  identityReputationChanges: z.record(identityValidation, z.number().int()),
  isBlockEligible: z.boolean(),
  resultHash: hashValidation,
  webhitsClaimAddress: addressValidation,
  viewOfTruthHash: hashValidation,
  maxBasePricePerKb: micronoteTokenValidation,
  maxBasePricePerQuery: micronoteTokenValidation,
});

type IProofOfKnowledge = z.infer<typeof ProofOfKnowledgeSchema>;

export default IProofOfKnowledge;
