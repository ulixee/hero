import { MicronoteBatchApiSchemas } from './MicronoteBatchApis';
import { NoteApiSchemas } from './NoteApis';
import { MicronoteApiSchemas } from './MicronoteApis';
import { FundingTransferApiSchemas } from './FundingTransferApis';
import { AddressApiSchemas } from './AddressApis';
import { StakeApiSchemas } from './StakeApis';
import { GiftCardApiSchemas } from './GiftCardApis';
import { SidechainInfoApiSchemas } from './SidechainInfoApis';
import { IZodHandlers, IZodSchemaToApiTypes } from '../utils/IZodApi';

const SidechainApiSchema = {
  ...SidechainInfoApiSchemas,
  ...AddressApiSchemas,
  ...FundingTransferApiSchemas,
  ...MicronoteApiSchemas,
  ...MicronoteBatchApiSchemas,
  ...NoteApiSchemas,
  ...StakeApiSchemas,
  ...GiftCardApiSchemas,
};

export type ISidechainApiTypes = IZodSchemaToApiTypes<typeof SidechainApiSchema>;

export type ISidechainApis = IZodHandlers<typeof SidechainApiSchema>;

export default SidechainApiSchema;
