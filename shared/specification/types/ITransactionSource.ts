import { z } from 'zod';
import { blockHeightValidation, hashValidation } from '../common';
import { AddressSignatureSchema } from './IAddressSignature';
import LedgerType from './LedgerType';

export const TransactionSourceSchema = z.object({
  sourceTransactionHash: hashValidation.optional(),
  sourceOutputIndex: z.number().int().nonnegative().optional(),
  sourceAddressSignatureSettings: AddressSignatureSchema.shape.signatureSettings,
  sourceAddressSigners: AddressSignatureSchema.shape.signers,
  sourceLedger: z.nativeEnum(LedgerType), // if coinage or bond, need to specify where we're trying to grab from
  blockClaimHeight: blockHeightValidation.optional(), // required if the transaction source is a coinage claim
  coinageHash: hashValidation.optional(), // required for coinage claims
});

type ITransactionSource = z.infer<typeof TransactionSourceSchema>;

export default ITransactionSource;
