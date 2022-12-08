import { z } from 'zod';
import {
  blockHeightValidation,
  giftCardIdValidation,
  giftCardRemptionKeyValidation,
  identityValidation,
  micronoteIdValidation,
  micronoteTokenValidation,
  signatureValidation,
} from '../common';
import { MicronoteBatchSchema } from './IMicronoteBatch';

export const MicronoteSchema = z.object({
  microgons: micronoteTokenValidation,
  micronoteId: micronoteIdValidation,
  blockHeight: blockHeightValidation,
  batchSlug: MicronoteBatchSchema.shape.batchSlug,
  micronoteBatchUrl: z.string().url(),
  micronoteBatchIdentity: identityValidation,
  micronoteSignature: signatureValidation,
  sidechainIdentity: identityValidation,
  sidechainValidationSignature: signatureValidation,
  // guaranteeBlockHash: hashValidation.describe('TODO: Add back in. This should tell a server what block hash they can choose to trust or not'),
  guaranteeBlockHeight: blockHeightValidation,
});

export const PaymentSchema = z.object({
  micronote: MicronoteSchema.extend({
    holdAuthorizationCode: z
      .string()
      .length(16)
      .optional()
      .describe('A hold authorization code granting sub-holds on a micronote.'),
  }).optional(),
  giftCard: z
    .object({
      id: giftCardIdValidation,
      sidechainIdentity: identityValidation,
      redemptionKey: giftCardRemptionKeyValidation,
    })
    .optional(),
});

type IPayment = z.infer<typeof PaymentSchema>;

export default IPayment;
