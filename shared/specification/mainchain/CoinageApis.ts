import { z } from 'zod';
import { IZodSchemaToApiTypes } from '../utils/IZodApi';
import { CoinageSchema } from '../types/ICoinage';

export enum CoinageError {
  BAD_SIGNATURE = 0,
  NO_PERMISSIONS = 1,
  INVALID_PARAMETER = 2,
  INVALID_TYPE = 3,
}

export const CoinageApiSchemas = {
  'Coinage.create': {
    args: z.object({
      coinage: CoinageSchema,
    }),
    result: z.object({
      accept: z.boolean(),
      error: z.nativeEnum(CoinageError),
    }),
  },
  'Coinage.created': {
    args: z.object({
      coinage: CoinageSchema,
      nodeIdsAlreadySent: z.string().array(),
    }),
    result: z.object({
      accept: z.boolean(),
      error: z.nativeEnum(CoinageError),
    }),
  },
};

type ICoinageApis = IZodSchemaToApiTypes<typeof CoinageApiSchemas>;
export default ICoinageApis;
