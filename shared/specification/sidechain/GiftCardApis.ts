import { z } from 'zod';
import { IZodSchemaToApiTypes } from '../utils/IZodApi';
import {
  giftCardIdValidation,
  giftCardRemptionKeyValidation,
  identityValidation,
  micronoteTokenValidation,
  signatureValidation,
} from '../common';
import { MicronoteBatchSchema } from '../types/IMicronoteBatch';

export const GiftCardApiSchemas = {
  'GiftCard.create': {
    args: z.object({
      batchSlug: MicronoteBatchSchema.shape.batchSlug,
      microgons: micronoteTokenValidation,
      issuerIdentities: z.array(identityValidation),
      issuerSignatures: z.array(signatureValidation),
    }),
    result: z.object({
      giftCardId: giftCardIdValidation,
      redemptionKey: giftCardRemptionKeyValidation,
    }),
  },
  'GiftCard.get': {
    args: z.object({
      batchSlug: MicronoteBatchSchema.shape.batchSlug,
      giftCardId: giftCardIdValidation,
    }),
    result: z.object({
      id: giftCardIdValidation,
      balance: micronoteTokenValidation,
      issuerIdentities: z.array(identityValidation),
    }),
  },
  'GiftCard.createHold': {
    args: z.object({
      batchSlug: MicronoteBatchSchema.shape.batchSlug,
      giftCardId: giftCardIdValidation,
      microgons: micronoteTokenValidation,
      signature: signatureValidation.describe('Signature using the redemption key of the GiftCard'),
    }),
    result: z.object({
      holdId: z.string().length(32),
      giftCardBalance: micronoteTokenValidation,
    }),
  },
  'GiftCard.settleHold': {
    args: z.object({
      batchSlug: MicronoteBatchSchema.shape.batchSlug,
      giftCardId: giftCardIdValidation,
      holdId: z.string().length(32),
      microgons: micronoteTokenValidation.describe(
        'Final microgon total to settle with. NOTE: if this exceeds the available balance, the balance will take available funds.',
      ),
    }),
    result: z.object({
      success: z.boolean(),
      microgonsAllowed: micronoteTokenValidation.describe('The microgons settled.'),
      giftCardBalance: micronoteTokenValidation,
    }),
  },
};

type IGiftCardApis = IZodSchemaToApiTypes<typeof GiftCardApiSchemas>;
export default IGiftCardApis;
