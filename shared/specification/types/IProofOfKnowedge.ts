import { z } from 'zod';
import {
  addressValidation,
  blockHeightValidation,
  hashValidation,
  micronoteIdValidation,
  micronoteTokenValidation,
  nodeIdValidation,
} from '../common';
import { XoredCandidateSchema } from './IXoredCandidate';
import { CoordinatorSchema } from './ICoordinator';

export const ProofOfKnowledgeSchema = z.object({
  hash: hashValidation,
  jobMicronoteId: micronoteIdValidation,
  jobBlockHeight: blockHeightValidation,
  blockHeight: blockHeightValidation,
  xoredCandidates: XoredCandidateSchema.array(),
  coordinator: CoordinatorSchema,
  decoderHash: hashValidation,
  decoderReputation: z.number().int().nonnegative(),
  nodeIdReputationChanges: z.record(nodeIdValidation, z.number().int()),
  isBlockEligible: z.boolean(),
  resultHash: hashValidation,
  webhitsClaimAddress: addressValidation,
  viewOfTruthHash: hashValidation,
  maxBasePricePerKb: micronoteTokenValidation,
  maxBasePricePerQuery: micronoteTokenValidation,
});

type IProofOfKnowledge = z.infer<typeof ProofOfKnowledgeSchema>;

export default IProofOfKnowledge;
