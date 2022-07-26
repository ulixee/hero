import { z } from 'zod';
import { identityValidation, signatureValidation } from '../common';
import { ProofOfKnowledgeSchema } from './IProofOfKnowedge';

export const DatumSchema = z.object({
  finalResult: z.any(),
  proof: ProofOfKnowledgeSchema.array(),
  signature: signatureValidation,
  identity: identityValidation,
  lastUpdated: z.string(),
  isError: z.boolean(),
});

type IDatum = z.infer<typeof DatumSchema>;

export default IDatum;
