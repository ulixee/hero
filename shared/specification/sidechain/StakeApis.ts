import { z } from 'zod';
import { NoteSchema } from '../types/INote';
import { IZodSchemaToApiTypes } from '../utils/IZodApi';
import { StakeSettingsSchema } from '../types/IStakeSettings';
import {
  addressValidation,
  blockHeightValidation,
  hashValidation,
  identityValidation,
  signatureValidation,
} from '../common';
import { StakeSignatureSchema } from '../types/IStakeSignature';
import { AddressSignatureSchema } from '../types/IAddressSignature';

export const StakeApiSchemas = {
  'Stake.settings': { args: z.undefined().nullish(), result: StakeSettingsSchema },
  'Stake.create': {
    args: z.object({
      note: NoteSchema,
      stakedIdentity: identityValidation,
    }),
    result: StakeSignatureSchema,
  },
  'Stake.refund': {
    args: z.object({
      address: addressValidation,
      stakedIdentity: identityValidation,
      signature: AddressSignatureSchema,
    }),
    result: z.object({
      blockEndHeight: blockHeightValidation,
      refundNoteHash: hashValidation,
      refundEffectiveHeight: blockHeightValidation,
    }),
  },
  'Stake.signature': {
    args: z.object({
      stakedIdentity: identityValidation,
      signature: signatureValidation,
    }),
    result: StakeSignatureSchema,
  },
};

type IStakeApis = IZodSchemaToApiTypes<typeof StakeApiSchemas>;
export default IStakeApis;
