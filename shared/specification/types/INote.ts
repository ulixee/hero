import { z } from 'zod';
import { WalletSignatureSchema } from './IWalletSignature';
import { addressValidation, blockHeightValidation, hashValidation } from '../common';
import NoteType from './NoteType';

export const NoteSchema = z.object({
  toAddress: addressValidation,
  fromAddress: addressValidation,
  centagons: z.bigint().refine(x => x > 0),
  noteHash: hashValidation,
  type: z.nativeEnum(NoteType),
  effectiveBlockHeight: blockHeightValidation.optional(),
  timestamp: z.date(),
  signature: WalletSignatureSchema,
});

type INote = z.infer<typeof NoteSchema>;
export default INote;
