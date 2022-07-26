import { z } from 'zod';
import { IZodSchemaToApiTypes } from '../utils/IZodApi';
import {
  addressValidation,
  creditIdValidation,
  identityValidation,
  micronoteTokenValidation,
  signatureValidation,
} from '../common';
import { AddressSignatureSchema } from '../types/IAddressSignature';
import { MicronoteBatchSchema } from '../types/IMicronoteBatch';

export const CreditApiSchemas = {
  'Credit.create': {
    args: z.object({
      batchSlug: MicronoteBatchSchema.shape.batchSlug,
      microgons: micronoteTokenValidation,
      allowedRecipientAddresses: z.array(addressValidation),
      allowedRecipientSignatures: z.array(AddressSignatureSchema),
    }),
    result: z.object({
      creditId: creditIdValidation,
      sidechainIdentity: identityValidation,
      sidechainValidationSignature: signatureValidation,
    }),
  },
  'Credit.claim': {
    args: z.object({
      batchSlug: MicronoteBatchSchema.shape.batchSlug,
      creditId: creditIdValidation,
      address: addressValidation,
    }),
    result: z.object({
      fundsId: z.number().int().positive(),
      microgons: micronoteTokenValidation,
      allowedRecipientAddresses: z.array(addressValidation),
    }),
  },
};

type ICreditApis = IZodSchemaToApiTypes<typeof CreditApiSchemas>;
export default ICreditApis;
