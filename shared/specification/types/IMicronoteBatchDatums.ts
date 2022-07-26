import { z } from 'zod';
import { hashValidation, publicKeyValidation } from '../common';

export const MicronoteBatchDatumsSchema = z.object({
  micronoteBatchUrl: z.string().url(),
  micronoteBatchPublicKey: publicKeyValidation,
  jobMicronoteIdsHash: hashValidation,
  jobsCount: z.number().nonnegative(),
});

type IMicronoteBatchDatums = z.infer<typeof MicronoteBatchDatumsSchema>;

export default IMicronoteBatchDatums;
