import { z } from 'zod';
import { hashValidation, identityValidation } from '../common';

export const MicronoteBatchDatumsSchema = z.object({
  micronoteBatchUrl: z.string().url(),
  micronoteBatchIdentity: identityValidation,
  micronoteIdsHash: hashValidation,
  micronotesCount: z.number().nonnegative(),
});

type IMicronoteBatchDatums = z.infer<typeof MicronoteBatchDatumsSchema>;

export default IMicronoteBatchDatums;
