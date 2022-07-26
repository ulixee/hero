import { z } from 'zod';
import IMicronoteBatchApis, { MicronoteBatchApiSchemas } from './MicronoteBatchApis';
import INoteApis, { NoteApiSchemas } from './NoteApis';
import IMicronoteApis, { MicronoteApiSchemas } from './MicronoteApis';
import IFundingTransferApis, { FundingTransferApiSchemas } from './FundingTransferApis';
import IWalletApis, { WalletApiSchemas } from './WalletApis';
import IStakeApis, { StakeApiSchemas } from './StakeApis';

const SidechainApiSchema = {
  ...WalletApiSchemas,
  ...FundingTransferApiSchemas,
  ...MicronoteApiSchemas,
  ...MicronoteBatchApiSchemas,
  ...NoteApiSchemas,
  ...StakeApiSchemas,
};

export type ISidechainApiTypes = IWalletApis &
  IFundingTransferApis &
  IMicronoteApis &
  IMicronoteBatchApis &
  INoteApis &
  IStakeApis;

export type ISidechainApis = {
  [Api in keyof ISidechainApiTypes]: (
    args: z.infer<typeof SidechainApiSchema[Api]['args']>,
  ) => Promise<z.infer<typeof SidechainApiSchema[Api]['result']>>;
};

export default SidechainApiSchema;
