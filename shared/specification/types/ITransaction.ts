import { z } from 'zod';
import { blockHeightValidation, hashValidation } from '../common';
import { TransactionSourceSchema } from './ITransactionSource';
import { TransactionOutputSchema } from './ITransactionOutput';
import TransactionType from './TransactionType';

export const TransactionSchema = z.object({
  transactionHash: hashValidation, // transaction hash
  version: z.string(),
  time: z.date(),
  type: z.nativeEnum(TransactionType),
  expiresAtBlockHeight: blockHeightValidation,
  sources: TransactionSourceSchema.array(), // empty means coinbase (ie, printed)
  outputs: TransactionOutputSchema.array(),
});

type ITransaction = z.infer<typeof TransactionSchema>;

export default ITransaction;
