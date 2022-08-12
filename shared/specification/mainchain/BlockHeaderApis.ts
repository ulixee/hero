import { z } from 'zod';
import { blockHeightValidation, hashValidation } from '../common';
import { IZodSchemaToApiTypes } from '../utils/IZodApi';
import { BlockHeaderSchema } from '../types/IBlockHeader';

export const BlockHeaderApiSchemas = {
  'BlockHeader.getMany': {
    args: z.object({
      heights: blockHeightValidation.array(),
    }),
    result: z.object({
      headers: BlockHeaderSchema.array(),
    }),
  },
  'BlockHeader.get': {
    args: z.object({
      hash: hashValidation,
      includeFork: z.boolean(),
    }),
    result: z.object({
      header: BlockHeaderSchema,
      isOnFork: z.boolean(),
    }),
  },
};

type IBlockHeaderApis = IZodSchemaToApiTypes<typeof BlockHeaderApiSchemas>;
export default IBlockHeaderApis;
