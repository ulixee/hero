import { z } from 'zod';
import { hashValidation, publicKeyValidation } from '../common';

export const AuthorizedSidechainTransferSchema = z.object({
  sidechainHash: hashValidation,
  transferSignature: hashValidation,
});

export const AuthorizedSidechainSchema = z.object({
  sidechainHash: hashValidation,
  rootPublicKey: publicKeyValidation,
  url: z.string().url(),
  transfer: AuthorizedSidechainTransferSchema.array().optional(), // optional - if rotating key/address
});

type IAuthorizedSidechain = z.infer<typeof AuthorizedSidechainSchema>;
type IAuthorizedSidechainTransfer = z.infer<typeof AuthorizedSidechainTransferSchema>;

export { IAuthorizedSidechainTransfer };

export default IAuthorizedSidechain;
