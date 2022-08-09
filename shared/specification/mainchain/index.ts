import { BlockApiSchemas } from './BlockApis';
import { BlockHeaderApiSchemas } from './BlockHeaderApis';
import { SidechainGovernanceSchemas } from './SidechainGovernanceApis';
import { CoinageApiSchemas } from './CoinageApis';
import { TransactionApiSchemas } from './TransactionApis';
import { IZodHandlers, IZodSchemaToApiTypes } from '../utils/IZodApi';

const MainchainApiSchema = {
  ...BlockApiSchemas,
  ...BlockHeaderApiSchemas,
  ...CoinageApiSchemas,
  ...SidechainGovernanceSchemas,
  ...TransactionApiSchemas,
};

export type IMainchainApiTypes = IZodSchemaToApiTypes<typeof MainchainApiSchema>;

export type IMainchainApis = IZodHandlers<typeof MainchainApiSchema>;

export default MainchainApiSchema;
