import { z } from 'zod';
import { AddressSignatureSchema } from './IAddressSignature';
import { addressValidation, blockHeightValidation, hashValidation } from '../common';
import NoteType from './NoteType';

export const NoteSchema = z.object({
  toAddress: addressValidation,
  fromAddress: addressValidation,
  centagons: z.bigint().refine(x => x > 0),
  noteHash: hashValidation,
  type: z.nativeEnum(NoteType),
  effectiveBlockHeight: blockHeightValidation.optional(),
  guaranteeBlockHeight: blockHeightValidation.optional(),
  timestamp: z.date(),
  signature: AddressSignatureSchema,
});

type INote = z.infer<typeof NoteSchema>;
export default INote;
