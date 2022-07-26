import { z } from 'zod';
import IMicronoteBatchApis, { MicronoteBatchApiSchemas } from './MicronoteBatchApis';
import INoteApis, { NoteApiSchemas } from './NoteApis';
import IMicronoteApis, { MicronoteApiSchemas } from './MicronoteApis';
import IFundingTransferApis, { FundingTransferApiSchemas } from './FundingTransferApis';
import IAddressApis, { AddressApiSchemas } from './AddressApis';
import IStakeApis, { StakeApiSchemas } from './StakeApis';
import ICreditApis, { CreditApiSchemas } from './CreditApis';

const SidechainApiSchema = {
  ...AddressApiSchemas,
  ...FundingTransferApiSchemas,
  ...MicronoteApiSchemas,
  ...MicronoteBatchApiSchemas,
  ...NoteApiSchemas,
  ...StakeApiSchemas,
  ...CreditApiSchemas,
};

export type ISidechainApiTypes = IAddressApis &
  IFundingTransferApis &
  IMicronoteApis &
  IMicronoteBatchApis &
  INoteApis &
  IStakeApis &
  ICreditApis;

export type ISidechainApis = {
  [Api in keyof ISidechainApiTypes]: (
    args: z.infer<typeof SidechainApiSchema[Api]['args']>,
  ) => Promise<z.infer<typeof SidechainApiSchema[Api]['result']>>;
};

export default SidechainApiSchema;
