import { z } from 'zod';
import { addressValidation } from '../common';
import { IZodSchemaToApiTypes } from '../utils/IZodApi';
import { WalletSignatureSchema } from '../types/IWalletSignature';

export const WalletApiSchemas = {
  'Wallet.register': {
    args: z.object({
      address: addressValidation,
      signature: WalletSignatureSchema,
    }),
    result: z.object({
      success: z.boolean(),
    }),
  },
  'Wallet.getBalance': {
    args: z.object({
      address: addressValidation,
    }),
    result: z.object({
      balance: z.bigint(),
    }),
  },
};

type IWalletApis = IZodSchemaToApiTypes<typeof WalletApiSchemas>;
export default IWalletApis;
