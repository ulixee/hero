import { z } from 'zod';
import { hashValidation } from '../common';
import { WalletSignatureSchema } from './IWalletSignature';

export const GrantTransferSchema = z.object({
  coinageHash: hashValidation,
  signature: WalletSignatureSchema,
});

type IGrantTransfer = z.infer<typeof GrantTransferSchema>;

export default IGrantTransfer;
