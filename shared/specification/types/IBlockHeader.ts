import { z } from 'zod';
import { blockHeightValidation, hashValidation } from '../common';
import { ArithmeticEncodingSchema } from './IArithmeticEncoding';

export const BlockHeaderSchema = z.object({
  hash: hashValidation,
  version: z.string(),
  height: blockHeightValidation,
  linkNonce: hashValidation,
  prevBlockHash: hashValidation,
  nextLinkTarget: ArithmeticEncodingSchema, // the max value of the hash that is allowed for the next linked block
  time: z.date(),
  stableMerkleRoot: hashValidation,
  sharesMerkleRoot: hashValidation,
  coinagesHash: hashValidation,
  bondCentagonsCreated: z.bigint().refine(x => x >= 0n, 'Cannot be negative'),
  stableCoinUSDCents: z.number().int().nonnegative(), // figure out bond price from stable price.
  stableCoinVolume: z.number().int().nonnegative(), // figure out bond price from stable price. NOTE: not in centagons
  datumSummaryHash: hashValidation,
  sampledBitsHash: hashValidation,
  xoredCandidateDistance: ArithmeticEncodingSchema, // minimum xor distance for future candidates
  xoredCandidateAverage: z.number().int().nonnegative(),
  sidechainChangesHash: hashValidation,
  sidechainSnapshotsHash: hashValidation,
});

type IBlockHeader = z.infer<typeof BlockHeaderSchema>;
export default IBlockHeader;
