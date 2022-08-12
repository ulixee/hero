import { z } from 'zod';
import CoinageType from './CoinageType';
import {
  addressValidation,
  blockHeightValidation,
  centagonTokenValidation,
  hashValidation,
} from '../common';
import { GrantTransferSchema } from './IGrantTransfer';

export const CoinageSchema = z.object({
  type: z.nativeEnum(CoinageType),
  hash: hashValidation,
  centagons: centagonTokenValidation,
  minimumClaimCentagons: centagonTokenValidation,
  blockHeight: blockHeightValidation,
  expirationBlockHeight: blockHeightValidation,
  oldestClaimHeight: blockHeightValidation,
  grantAddress: addressValidation,
  transfer: GrantTransferSchema, // optional - if rotating key/address
});

type ICoinage = z.infer<typeof CoinageSchema>;

export default ICoinage;
