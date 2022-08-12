import { z } from 'zod';
import { addressValidation, blockHeightValidation, hashValidation } from '../common';
import { IZodSchemaToApiTypes } from '../utils/IZodApi';
import { NoteSchema } from '../types/INote';

export const FundingTransferApiSchemas = {
  'FundingTransfer.status': {
    args: z.object({
      noteHash: hashValidation,
    }),
    result: z.object({
      transactionHash: hashValidation,
      currentBlockHeight: blockHeightValidation,
      blocks: z
        .object({
          blockHash: hashValidation,
          blockHeight: blockHeightValidation,
        })
        .array(),
    }),
  },
  'FundingTransfer.keys': {
    args: z.object({}),
    result: z.object({
      transferOutKey: addressValidation,
      transferInKeys: addressValidation.array(),
    }),
  },
  'FundingTransfer.out': {
    args: z.object({
      note: NoteSchema,
    }),
    result: z.object({
      noteHash: hashValidation,
      currentBlockHash: hashValidation,
    }),
  },
};

type IFundingTransferApis = IZodSchemaToApiTypes<typeof FundingTransferApiSchemas>;
export default IFundingTransferApis;
