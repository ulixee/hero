import { z } from 'zod';
import { hashValidation } from '../common';
import { AddressSignatureSchema } from './IAddressSignature';

export const GrantTransferSchema = z.object({
  coinageHash: hashValidation,
  signature: AddressSignatureSchema,
});

type IGrantTransfer = z.infer<typeof GrantTransferSchema>;

export default IGrantTransfer;
