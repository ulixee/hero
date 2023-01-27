import { z } from 'zod';
import { datastoreVersionHashValidation } from '../common';

export const DatastoreRunnerPricing = z.object({
  minimum: z.number().int().nonnegative().optional().describe('Minimum price for this step.'),
  perQuery: z.number().int().nonnegative().describe('Base price per query.'),
  addOns: z
    .object({
      perKb: z
        .number()
        .int()
        .nonnegative()
        .optional()
        .describe('Optional add-on price per kilobyte of output data.'),
    })
    .optional(),
  remoteMeta: z
    .object({
      host: z.string().describe('The remote host'),
      datastoreVersionHash: datastoreVersionHashValidation,
      runnerName: z.string().describe('The remote runner name'),
    })
    .optional(),
});
type IDatastoreRunnerPricing = z.infer<typeof DatastoreRunnerPricing>;

export default IDatastoreRunnerPricing;
