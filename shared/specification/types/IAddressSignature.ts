import { z } from 'zod';
import { MerkleProofSchema } from './IMerkleProof';
import { AddressOwnershipProofSchema } from './IAddressOwnershipProof';

export const AddressSignatureSchema = z.object({
  signers: AddressOwnershipProofSchema.array(),
  signatureSettings: z.object({
    countRequired: z.number(),
    settingsMerkleProofs: MerkleProofSchema.array(),
    salt: z.instanceof(Buffer).optional(),
    identityIndices: z.number().array().optional(),
  }),
});

type IAddressSignature = z.infer<typeof AddressSignatureSchema>;
export default IAddressSignature;
