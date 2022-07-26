import { z } from 'zod';
import { blockHeightValidation, hashValidation } from '../common';
import { WalletSignatureSchema } from './IWalletSignature';
import LedgerType from './LedgerType';

export const TransactionSourceSchema = z.object({
  sourceTransactionHash: hashValidation.optional(),
  sourceOutputIndex: z.number().int().nonnegative().optional(),
  sourceWalletSignatureSettings: WalletSignatureSchema.shape.signatureSettings,
  sourceWalletSigners: WalletSignatureSchema.shape.signers,
  sourceLedger: z.nativeEnum(LedgerType), // if coinage or bond, need to specify where we're trying to grab from
  blockClaimHeight: blockHeightValidation.optional(), // required if the transaction source is a coinage claim
  coinageHash: hashValidation.optional(), // required for coinage claims
});

type ITransactionSource = z.infer<typeof TransactionSourceSchema>;

export default ITransactionSource;
