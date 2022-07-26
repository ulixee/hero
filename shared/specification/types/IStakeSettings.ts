import { z } from 'zod';
import {
  addressValidation,
  blockHeightValidation,
  centagonTokenValidation,
  hashValidation,
  publicKeyValidation,
} from '../common';

export const StakeSettingsSchema = z.object({
  centagons: centagonTokenValidation,
  rootPublicKey: publicKeyValidation,
  stakeAddress: addressValidation,
  stableBlockHeight: blockHeightValidation,
  stableBlockHash: hashValidation,
  currentBlockHash: hashValidation,
  currentBlockHeight: blockHeightValidation,
  refundBlockWindow: z.number().int().nonnegative(),
});

type IStateSettings = z.infer<typeof StakeSettingsSchema>;

export default IStateSettings;
