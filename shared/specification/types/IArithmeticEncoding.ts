import { z } from 'zod';

export const ArithmeticEncodingSchema = z.object({
  powerOf2: z.number().nonnegative(),
  multiplierE6: z.number().nonnegative().optional(),
});

type IArithmeticEncoding = z.infer<typeof ArithmeticEncodingSchema>;
export default IArithmeticEncoding;
