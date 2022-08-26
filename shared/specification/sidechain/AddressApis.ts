import { z } from 'zod';
import { addressValidation } from '../common';
import { IZodSchemaToApiTypes } from '../utils/IZodApi';

export const AddressApiSchemas = {
  'Address.getBalance': {
    args: z.object({
      address: addressValidation,
    }),
    result: z.object({
      balance: z.bigint(),
    }),
  },
  'Address.register': {
    args: z.object({
      address: addressValidation,
    }),
    result: z.object({
      success: z.boolean(),
    }),
  },
};

type IAddressApis = IZodSchemaToApiTypes<typeof AddressApiSchemas>;
export default IAddressApis;
