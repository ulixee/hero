import { z } from 'zod';
import { BlockHeaderSchema } from './IBlockHeader';
import { AuthorizedSidechainSchema } from './IAuthorizedSidechain';
import { TransactionSchema } from './ITransaction';
import { CoinageSchema } from './ICoinage';
import { DatumSummarySchema } from './IDatumSummary';
import { BitDatumHistorySchema } from './IBitDatumHistory';

export const BlockSchema = z.object({
  header: BlockHeaderSchema,
  stableLedger: TransactionSchema.array(),
  sharesLedger: TransactionSchema.array(), // all share trades must happen in the sharesLedger
  // these fields can be rolled off
  coinages: CoinageSchema.array(),
  datumSummary: DatumSummarySchema,
  bitSampling: z.object({
    bitDatumHistories: BitDatumHistorySchema.array(),
  }),
  sidechainGovernance: z.object({
    authorizedSidechains: AuthorizedSidechainSchema.array(),
  }),
  // repeated SidechainSnapshot sidechainSnapshots = 8;
});

type IBlock = z.infer<typeof BlockSchema>;

export default IBlock;
