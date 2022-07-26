import { z } from 'zod';
import { identityValidation, signatureValidation } from '../common';
import { MerkleProofSchema } from './IMerkleProof';

export const AddressOwnershipProofSchema = z.object({
  signature: signatureValidation,
  identity: identityValidation,
  ownershipMerkleProofs: MerkleProofSchema.array(),
});

type IAddressOwnershipProof = z.infer<typeof AddressOwnershipProofSchema>;

export default IAddressOwnershipProof;
