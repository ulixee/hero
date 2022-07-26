import { z } from 'zod';
import { addressValidation, hashValidation } from '../common';

export const AddressCountsSchema = z.object({
  claimAddress: addressValidation,
  count: z.number().int().nonnegative(),
});

export const WebhitsClaimAddressSchema = z.object({
  viewOfTruthHash: hashValidation,
  addressCounts: AddressCountsSchema.array(),
});

type IWebhitsClaimAddress = z.infer<typeof WebhitsClaimAddressSchema>;

export default IWebhitsClaimAddress;
