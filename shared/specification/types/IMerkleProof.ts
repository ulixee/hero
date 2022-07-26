import { z } from 'zod';
import { hashValidation } from '../common';

enum MerklePosition {
  Left = 0,
  Right = 1,
}

export const MerkleProofSchema = z.object({
  position: z.nativeEnum(MerklePosition),
  hash: hashValidation,
});

type IMerkleProof = z.infer<typeof MerkleProofSchema>;
export { MerklePosition };
export default IMerkleProof;
