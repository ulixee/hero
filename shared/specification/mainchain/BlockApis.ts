import { z } from 'zod';
import { addressValidation, blockHeightValidation, hashValidation } from '../common';
import { IZodSchemaToApiTypes } from '../utils/IZodApi';
import { DatumSummarySchema } from '../types/IDatumSummary';
import { BlockSchema } from '../types/IBlock';
import BlockError from '../types/BlockError';
import { BitDatumHistorySchema } from '../types/IBitDatumHistory';
import { BlockSettingsSchema } from '../types/IBlockSettings';
import { LedgerType } from '../index';

export const BlockApiSchemas = {
  'Block.create': {
    args: z.object({
      prevBlockHash: hashValidation,
      payoutAddress: addressValidation,
      linkNonce: hashValidation, // since already calculated, send it through
      datumSummary: DatumSummarySchema,
      bitSampling: z.object({
        bitDatumHistories: BitDatumHistorySchema.array(),
      }), // sampling of node jobs
    }),
    result: z.object({
      success: z.boolean(),
    }),
  },
  'Block.created': {
    args: z.object({
      block: BlockSchema,
      nodeIdsAlreadySent: z.string().array(),
    }),
    result: z.object({
      accept: z.boolean(),
      error: z.nativeEnum(BlockError),
      message: z.string(),
    }),
  },
  'Block.findWithTransaction': {
    args: z.object({
      transactionHash: hashValidation,
      ledgerType: z.nativeEnum(LedgerType),
    }),
    result: z.object({
      blockHeight: blockHeightValidation,
      merkleRoot: hashValidation,
      blockHash: hashValidation,
    }),
  },
  'Block.getMany': {
    args: z.object({
      blockHeights: blockHeightValidation.array(),
      blockHashes: hashValidation.array(),
    }),
    result: z.object({
      blocks: BlockSchema.array(),
    }),
  },
  'Block.settings': {
    args: z.object({
      blockHeight: blockHeightValidation.optional(),
    }),
    result: BlockSettingsSchema,
  },
};

type IBlockApis = IZodSchemaToApiTypes<typeof BlockApiSchemas>;
export default IBlockApis;
