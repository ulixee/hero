import { z } from 'zod';
import { NoteSchema } from '../types/INote';
import { IZodSchemaToApiTypes } from '../utils/IZodApi';
import { StakeSettingsSchema } from '../types/IStakeSettings';
import {
  addressValidation,
  blockHeightValidation,
  hashValidation,
  publicKeyValidation,
  signatureValidation,
} from '../common';
import { StakeSignatureSchema } from '../types/IStakeSignature';
import { WalletSignatureSchema } from '../types/IWalletSignature';

export const StakeApiSchemas = {
  'Stake.settings': { args: z.undefined().nullish(), result: StakeSettingsSchema },
  'Stake.create': {
    args: z.object({
      note: NoteSchema,
      stakedPublicKey: publicKeyValidation,
    }),
    result: StakeSignatureSchema,
  },
  'Stake.refund': {
    args: z.object({
      address: addressValidation,
      stakedPublicKey: publicKeyValidation,
      signature: WalletSignatureSchema,
    }),
    result: z.object({
      blockEndHeight: blockHeightValidation,
      refundNoteHash: hashValidation,
      refundEffectiveHeight: blockHeightValidation,
    }),
  },
  'Stake.signature': {
    args: z.object({
      stakedPublicKey: publicKeyValidation,
      signature: signatureValidation,
    }),
    result: StakeSignatureSchema,
  },
};

type IStakeApis = IZodSchemaToApiTypes<typeof StakeApiSchemas>;
export default IStakeApis;
