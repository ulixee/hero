import { z } from 'zod';
import { datastoreVersionHashValidation } from '../common';

export const DatastoreFunctionPricing = z.object({
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
      functionName: z.string().describe('The remote function name'),
    })
    .optional(),
});
type IDatastoreFunctionPricing = z.infer<typeof DatastoreFunctionPricing>;

export default IDatastoreFunctionPricing;
