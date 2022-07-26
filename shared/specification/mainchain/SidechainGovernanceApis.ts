import { z } from 'zod';
import { IZodSchemaToApiTypes } from '../utils/IZodApi';
import { AuthorizedSidechainSchema } from '../types/IAuthorizedSidechain';

export enum SidechainGovernanceError {
  BAD_SIGNATURE = 0,
  NO_PERMISSIONS = 1,
}

export const SidechainGovernanceSchemas = {
  'Sidechain.authorize': {
    args: z.object({
      sidechain: AuthorizedSidechainSchema,
    }),
    result: z.object({
      accept: z.boolean(),
      error: z.nativeEnum(SidechainGovernanceError),
    }),
  },
  'Sidechain.authorized': {
    args: z.object({
      sidechain: AuthorizedSidechainSchema,
      nodeIdsAlreadySent: z.string().array(),
    }),
    result: z.object({
      accept: z.boolean(),
      error: z.nativeEnum(SidechainGovernanceError),
    }),
  },
};

type ISidechainGovernanceApis = IZodSchemaToApiTypes<typeof SidechainGovernanceSchemas>;
export default ISidechainGovernanceApis;
