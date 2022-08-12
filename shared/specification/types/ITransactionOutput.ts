import { z } from 'zod';
import { addressValidation, centagonTokenValidation } from '../common';

export const TransactionOutputSchema = z.object({
  address: addressValidation, // signatureSettings + hashed alpha sorted public keys
  centagons: centagonTokenValidation,
  isBond: z.boolean().optional(),
  isBurned: z.boolean().optional(), // if the coins are burned up as part of the transaction
  addressOnSidechain: addressValidation.optional(),
  isSidechained: z.boolean().optional(),
});

type ITransactionOutput = z.infer<typeof TransactionOutputSchema>;

export default ITransactionOutput;
