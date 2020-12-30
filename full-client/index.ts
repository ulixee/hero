import 'source-map-support/register';
import agent, { ICoreConnectionOptions, LocalCoreConnection } from '@secret-agent/client';
import Core from '@secret-agent/core';

LocalCoreConnection.create = (options: ICoreConnectionOptions) => {
  const coreServerConnection = Core.addConnection();
  return new LocalCoreConnection(options, coreServerConnection);
};

export * from '@secret-agent/client';
export default agent;
