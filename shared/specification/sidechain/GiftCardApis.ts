import { z } from 'zod';
import { IZodSchemaToApiTypes } from '../utils/IZodApi';
import {
  addressValidation,
  giftCardIdValidation,
  identityValidation,
  micronoteTokenValidation,
  signatureValidation,
} from '../common';
import { AddressSignatureSchema } from '../types/IAddressSignature';
import { MicronoteBatchSchema } from '../types/IMicronoteBatch';

export const GiftCardApiSchemas = {
  'GiftCard.create': {
    args: z.object({
      batchSlug: MicronoteBatchSchema.shape.batchSlug,
      microgons: micronoteTokenValidation,
      redeemableWithAddresses: z.array(addressValidation),
      redeemableAddressSignatures: z.array(AddressSignatureSchema),
    }),
    result: z.object({
      giftCardId: giftCardIdValidation,
      sidechainIdentity: identityValidation,
      sidechainValidationSignature: signatureValidation,
    }),
  },
  'GiftCard.claim': {
    args: z.object({
      batchSlug: MicronoteBatchSchema.shape.batchSlug,
      giftCardId: giftCardIdValidation,
      address: addressValidation,
    }),
    result: z.object({
      fundsId: z.number().int().positive(),
      microgons: micronoteTokenValidation,
      redeemableWithAddresses: z.array(addressValidation),
    }),
  },
};

type IGiftCardApis = IZodSchemaToApiTypes<typeof GiftCardApiSchemas>;
export default IGiftCardApis;
