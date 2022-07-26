import { z } from 'zod';
import { hashValidation, identityValidation } from '../common';

export const AuthorizedSidechainTransferSchema = z.object({
  sidechainHash: hashValidation,
  transferSignature: hashValidation,
});

export const AuthorizedSidechainSchema = z.object({
  sidechainHash: hashValidation,
  rootIdentity: identityValidation,
  url: z.string().url(),
  transfer: AuthorizedSidechainTransferSchema.array().optional(), // optional - if rotating key/address
});

type IAuthorizedSidechain = z.infer<typeof AuthorizedSidechainSchema>;
type IAuthorizedSidechainTransfer = z.infer<typeof AuthorizedSidechainTransferSchema>;

export { IAuthorizedSidechainTransfer };

export default IAuthorizedSidechain;
