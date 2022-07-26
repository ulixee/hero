import { z } from 'zod';
import { MerkleProofSchema } from './IMerkleProof';
import { WalletOwnershipProofSchema } from './IWalletOwnershipProof';

export const WalletSignatureSchema = z.object({
  signers: WalletOwnershipProofSchema.array(),
  signatureSettings: z.object({
    countRequired: z.number(),
    settingsMerkleProofs: MerkleProofSchema.array(),
    salt: z.instanceof(Buffer).optional(),
    publicKeyIndices: z.number().array().optional(),
  }),
});

type IWalletSignature = z.infer<typeof WalletSignatureSchema>;
export default IWalletSignature;
