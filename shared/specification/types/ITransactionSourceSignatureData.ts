import { z } from 'zod';
import { addressValidation, centagonTokenValidation, hashValidation } from '../common';
import LedgerType from './LedgerType';
import TransactionType from './TransactionType';
import { TransactionOutputSchema } from './ITransactionOutput';
import { WalletSignatureSchema } from './IWalletSignature';

export const TransactionSourceSignatureDataSchema = z.object({
  version: z.string(),
  ledger: z.nativeEnum(LedgerType),
  type: z.nativeEnum(TransactionType),
  sourceTransactionHash: hashValidation, // transaction hash
  sourceTransactionOutputIndex: z.number().int().nonnegative(),
  sourceLedger: z.nativeEnum(LedgerType),
  address: addressValidation,
  walletSignatureSettings: WalletSignatureSchema.shape.signatureSettings, // signatures by other multisig authors
  centagons: centagonTokenValidation,
  coinageHash: hashValidation.optional(),
  outputs: TransactionOutputSchema.array(),
});

type ITransactionSourceSignatureData = z.infer<typeof TransactionSourceSignatureDataSchema>;

export default ITransactionSourceSignatureData;
