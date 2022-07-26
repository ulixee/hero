import { z } from 'zod';
import { addressValidation } from '../common';
import { IZodSchemaToApiTypes } from '../utils/IZodApi';
import { AddressSignatureSchema } from '../types/IAddressSignature';

export const AddressApiSchemas = {
  'Address.register': {
    args: z.object({
      address: addressValidation,
      signature: AddressSignatureSchema,
    }),
    result: z.object({
      success: z.boolean(),
    }),
  },
  'Address.getBalance': {
    args: z.object({
      address: addressValidation,
    }),
    result: z.object({
      balance: z.bigint(),
    }),
  },
};

type IAddressApis = IZodSchemaToApiTypes<typeof AddressApiSchemas>;
export default IAddressApis;
