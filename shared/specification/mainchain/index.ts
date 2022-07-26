import { z } from 'zod';
import IBlockApis, { BlockApiSchemas } from './BlockApis';
import IBlockHeaderApis, { BlockHeaderApiSchemas } from './BlockHeaderApis';
import ISidechainGovernanceApis, { SidechainGovernanceSchemas } from './SidechainGovernanceApis';
import ICoinageApis, { CoinageApiSchemas } from './CoinageApis';
import ITransactionApis, { TransactionApiSchemas } from './TransactionApis';

const MainchainApiSchema = {
  ...BlockApiSchemas,
  ...BlockHeaderApiSchemas,
  ...CoinageApiSchemas,
  ...SidechainGovernanceSchemas,
  ...TransactionApiSchemas,
};

export type IMainchainApiTypes = IBlockApis &
  IBlockHeaderApis &
  ICoinageApis &
  ISidechainGovernanceApis &
  ITransactionApis;

export type IMainchainApis = {
  [Api in keyof IMainchainApiTypes]: (
    args: z.infer<typeof MainchainApiSchema[Api]['args']>,
  ) => Promise<z.infer<typeof MainchainApiSchema[Api]['result']>>;
};

export default MainchainApiSchema;
