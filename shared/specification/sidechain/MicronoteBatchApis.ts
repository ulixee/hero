import { z } from 'zod';
import { MicronoteBatchSchema } from '../types/IMicronoteBatch';
import { NoteSchema } from '../types/INote';
import { addressValidation, micronoteTokenValidation } from '../common';
import { IZodSchemaToApiTypes } from '../utils/IZodApi';

const fundsIdValidation = z.string().length(30);

export const MicronoteBatchApiSchemas = {
  'MicronoteBatch.fund': {
    args: z.object({
      note: NoteSchema,
      batchSlug: MicronoteBatchSchema.shape.batchSlug,
    }),
    result: z.object({
      fundsId: fundsIdValidation,
    }),
  },
  'MicronoteBatch.activeFunds': {
    args: z.object({
      batchSlug: MicronoteBatchSchema.shape.batchSlug,
      address: addressValidation,
    }),
    result: z
      .object({
        fundsId: fundsIdValidation,
        microgonsRemaining: micronoteTokenValidation,
        allowedRecipientAddresses: addressValidation.array(),
      })
      .array(),
  },
  'MicronoteBatch.findFund': {
    args: z.object({
      batchSlug: MicronoteBatchSchema.shape.batchSlug,
      microgons: micronoteTokenValidation,
      address: addressValidation,
    }),
    result: z.object({
      fundsId: fundsIdValidation,
      microgonsRemaining: micronoteTokenValidation,
      allowedRecipientAddresses: addressValidation.array().optional(),
    }),
  },
  'MicronoteBatch.getFundSettlement': {
    args: z.object({
      fundIds: fundsIdValidation.array(),
      batchSlug: MicronoteBatchSchema.shape.batchSlug,
    }),
    result: z.object({
      isBatchSettled: z.boolean(),
      settledTime: z.date(),
      settlements: z
        .object({
          fundsId: fundsIdValidation,
          fundedCentagons: z.bigint().refine(x => x >= 0),
          settledCentagons: z.bigint().refine(x => x >= 0),
        })
        .array(),
    }),
  },
};

type IMicronoteBatchApis = IZodSchemaToApiTypes<typeof MicronoteBatchApiSchemas>;
export default IMicronoteBatchApis;
