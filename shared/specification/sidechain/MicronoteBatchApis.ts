import { z } from 'zod';
import { MicronoteBatchSchema } from '../types/IMicronoteBatch';
import { NoteSchema } from '../types/INote';
import { addressValidation, micronoteTokenValidation } from '../common';
import { IZodSchemaToApiTypes } from '../utils/IZodApi';

const fundsIdValidation = z.number().int().positive();

export const MicronoteBatchApiSchemas = {
  'MicronoteBatch.get': { args: z.undefined().nullish(), result: MicronoteBatchSchema },
  'MicronoteBatch.fund': {
    args: z.object({
      note: NoteSchema,
      batchSlug: MicronoteBatchSchema.shape.batchSlug,
    }),
    result: z.object({
      fundsId: fundsIdValidation,
    }),
  },
  'MicronoteBatch.findFund': {
    args: z.object({
      batchSlug: MicronoteBatchSchema.shape.batchSlug,
      microgons: micronoteTokenValidation,
      address: addressValidation,
    }),
    result: z.object({
      fundsId: z.number().int().positive(),
      microgonsRemaining: micronoteTokenValidation,
    }),
  },
  'MicronoteBatch.getFundSettlement': {
    args: z.object({
      fundIds: fundsIdValidation.array(),
      batchAddress: addressValidation,
    }),
    result: z.object({
      isBatchSettled: z.boolean(),
      settledTime: z.date(),
      settlements: z
        .object({
          fundsId: fundsIdValidation,
          fundedCentagons: NoteSchema.shape.centagons,
          settledCentagons: NoteSchema.shape.centagons,
        })
        .array(),
    }),
  },
};

type IMicronoteBatchApis = IZodSchemaToApiTypes<typeof MicronoteBatchApiSchemas>;
export default IMicronoteBatchApis;
