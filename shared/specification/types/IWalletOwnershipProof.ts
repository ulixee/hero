import { z } from 'zod';
import { publicKeyValidation, signatureValidation } from '../common';
import { MerkleProofSchema } from './IMerkleProof';

export const WalletOwnershipProofSchema = z.object({
  signature: signatureValidation,
  publicKey: publicKeyValidation,
  ownershipMerkleProofs: MerkleProofSchema.array(),
});

type IWalletOwnershipProof = z.infer<typeof WalletOwnershipProofSchema>;

export default IWalletOwnershipProof;
